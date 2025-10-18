const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');
const P = require('pino');
const db = require('../db');
const { generateToken } = require('./token');

let sock = null;
let isConnected = false;
let lastQR = null;
let reconnecting = false; // ⛔ cegah loop reconnect ganda

async function initWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(
      path.join(__dirname, '../baileys_auth_info') // pindah ke atas folder agar tidak numpuk
    );

    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger: P({ level: 'silent' }),
      browser: ['Armbian', 'Chrome', '1.0.0'],
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        lastQR = qr;
        console.log('📱 Scan QR berikut untuk login WhatsApp:');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'open') {
        console.log('✅ WhatsApp terhubung!');
        isConnected = true;
        reconnecting = false;
        lastQR = null;

        // Simpan / perbarui token di DB
        if (sock.user?.id) {
          try {
            await db.query('UPDATE wa_tokens SET is_active=0 WHERE device_id=?', [sock.user.id]);
            const token = generateToken();
            await db.query(
              'INSERT INTO wa_tokens (device_id, token, is_active, created_at) VALUES (?, ?, 1, NOW())',
              [sock.user.id, token]
            );
            console.log('🔑 Token API aktif:', token);
          } catch (err) {
            console.error('❌ Gagal menyimpan token:', err.message);
          }
        }
      }

      if (connection === 'close') {
        isConnected = false;
        const reason =
          lastDisconnect?.error?.output?.statusCode ||
          lastDisconnect?.error?.code ||
          'unknown';

        console.log(`⚠️ WhatsApp disconnected, reason: ${reason}`);

        if (reason === DisconnectReason.loggedOut || reason === 'loggedOut' || reason === 401) {
          console.log('❌ Session logout, perlu scan ulang.');
          if (sock?.user?.id)
            await db.query('UPDATE wa_tokens SET is_active=0 WHERE device_id=?', [sock.user.id]);
        } else if (!reconnecting) {
          reconnecting = true;
          console.log('🔄 Mencoba reconnect dalam 5 detik...');
          setTimeout(() => {
            initWhatsApp();
          }, 5000);
        }
      }
    });

    // Pesan masuk
    sock.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const sender = msg.key.remoteJid;
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '';

      console.log(`📩 Pesan dari ${sender}: ${text}`);

      // Simpan pesan ke DB
      try {
        await db.query(
          'INSERT INTO wa_messages (number, message, type, status) VALUES (?, ?, ?, ?)',
          [sender, text, 'inbound', 'received']
        );
      } catch (err) {
        console.error('❌ Gagal simpan pesan inbound:', err.message);
      }

      // Auto-reply rules
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
            break;
          }
        }
      } catch (err) {
        console.error('❌ Gagal cek auto-reply:', err.message);
      }

      // Ping test
      if (text.toLowerCase() === 'ping') {
        try {
          await sock.sendMessage(sender, { text: 'Pong! 🏓' });
        } catch (err) {
          console.error('❌ Gagal membalas ping:', err.message);
        }
      }
    });

    console.log('🚀 Socket WhatsApp siap! Jalankan scan QR jika diminta.');
  } catch (err) {
    console.error('❌ Gagal konek ke WhatsApp:', err.message);
    if (!reconnecting) {
      reconnecting = true;
      setTimeout(initWhatsApp, 5000);
    }
  }
}

// Fungsi kirim pesan manual
async function sendMessage(to, message) {
  try {
    if (!sock) throw new Error('Socket WhatsApp belum siap');
    if (!isConnected) throw new Error('Belum terhubung ke WhatsApp');

    const jid = to.includes('@s.whatsapp.net')
      ? to
      : to.replace(/\D/g, '') + '@s.whatsapp.net';
    await sock.sendMessage(jid, { text: message });

    console.log(`✅ Pesan terkirim ke ${to}`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Gagal kirim ke ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

function getSock() {
  return sock;
}
function getStatus() {
  return isConnected;
}
function getLastQR() {
  return lastQR;
}

module.exports = { initWhatsApp, getSock, getStatus, getLastQR, sendMessage };
