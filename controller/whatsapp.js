const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcodeTerminal = require('qrcode-terminal');
const db = require('../db');
const { generateToken } = require('./token');

let sock = null;
let isConnected = false;
let lastQR = null;

async function initWhatsApp() {
    try {
        // Auth state
        const { state, saveCreds } = await useMultiFileAuthState('./baileys_auth_info');
        sock = makeWASocket({ auth: state });
        sock.ev.on('creds.update', saveCreds);

        // Connection update
        sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
            if (qr) {
                lastQR = qr;
                console.log('📱 Scan QR berikut:');
                qrcodeTerminal.generate(qr, { small: true });
            }

            if (connection === 'open') {
                console.log('✅ WhatsApp terhubung!');
                isConnected = true;
                lastQR = null;

                if (sock.user?.id) {
                    await db.query('UPDATE wa_tokens SET is_active=0 WHERE device_id=?', [sock.user.id]);
                    const token = generateToken();
                    await db.query(
                        'INSERT INTO wa_tokens (device_id, token, is_active, created_at) VALUES (?, ?, 1, NOW())',
                        [sock.user.id, token]
                    );
                    console.log('🔑 Token API aktif:', token);
                }
            } else if (connection === 'close') {
                isConnected = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('❌ Session logout, harus scan ulang.');
                    if (sock?.user?.id) await db.query('UPDATE wa_tokens SET is_active=0 WHERE device_id=?', [sock.user.id]);
                } else {
                    console.log('❌ Terputus, reconnect 5 detik...');
                    setTimeout(initWhatsApp, 5000);
                }
            }
        });

        // Messages listener
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const sender = msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            console.log(`📩 Pesan dari ${sender}: ${text}`);

            // Simpan pesan inbound ke DB
            try {
                await db.query(
                    'INSERT INTO wa_messages (number, message, type, status) VALUES (?, ?, ?, ?)',
                    [sender, text, 'inbound', 'received']
                );
            } catch (err) {
                console.error('❌ Gagal simpan pesan inbound:', err.message);
            }

            // Auto-reply berbasis DB
            try {
                const [rules] = await db.query('SELECT * FROM auto_replies WHERE is_active=1');
                
                for (const rule of rules) {
                    let matched = false;

                    switch (rule.type) {
                        case 'exact':
                            matched = text.toLowerCase() === rule.keyword.toLowerCase();
                            break;
                        case 'contains':
                            matched = text.toLowerCase().includes(rule.keyword.toLowerCase());
                            break;
                        case 'regex':
                            try {
                                const regex = new RegExp(rule.keyword, 'i');
                                matched = regex.test(text);
                            } catch (err) {
                                console.error('Regex error:', err.message);
                            }
                            break;
                    }

                    if (matched) {
                        await sock.sendMessage(sender, { text: rule.reply_text });
                        console.log(`✉️ Auto-reply ke ${sender}: ${rule.reply_text}`);
                        break; // hanya balas rule pertama yang cocok
                    }
                }
            } catch (err) {
                console.error('❌ Gagal cek auto-reply:', err.message);
            }

            
            if (text.toLowerCase() === 'ping') {
                try {
                    await sock.sendMessage(sender, { text: 'Pong! 🏓' });
                } catch (err) {
                    console.error('❌ Gagal membalas pesan ping:', err.message);
                }
            }
        });

        console.log('🚀 Socket WhatsApp siap!');
    } catch (err) {
        console.error('❌ Gagal konek ke WhatsApp:', err.message);
        setTimeout(initWhatsApp, 5000);
    }
}

async function sendMessage(to, message) {
    try {
        if (!sock) throw new Error('Socket WhatsApp belum siap');
        if (!isConnected) throw new Error('Belum terhubung ke WhatsApp');

        const jid = to.includes('@s.whatsapp.net') ? to : to.replace(/\D/g, '') + '@s.whatsapp.net';
        await sock.sendMessage(jid, { text: message });

        console.log(`✅ Pesan terkirim ke ${to}`);
        return { success: true };
    } catch (err) {
        console.error(`❌ Gagal kirim ke ${to}:`, err.message);
        return { success: false, error: err.message };
    }
}


function getSock() { return sock; }
function getStatus() { return isConnected; }
function getLastQR() { return lastQR; }

module.exports = { initWhatsApp, getSock, getStatus, getLastQR, sendMessage };
