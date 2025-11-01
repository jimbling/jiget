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
const fs = require('fs-extra');

const authFolder = path.join(__dirname, '../baileys_auth_info');

let sock = null;
let isConnected = false;
let lastQR = null;
let reconnecting = false;

async function initWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
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

        if (sock.user?.id) {
  try {
    console.log('📡 Info sock.user:', JSON.stringify(sock.user, null, 2));

    const deviceId = sock.user.id;
    const phone = deviceId.split(':')[0].replace(/\D/g, '');

    const name =
      sock.user.verifiedName ||
      sock.user.name ||
      sock.user.pushname ||
      sock.user.platform ||
      'Unknown Device';

    console.log(`📱 Deteksi Device: ${phone} | Nama: ${name}`);

    // === CEK DEVICE DI DATABASE ===
    const [rows] = await db.query(
      'SELECT id, token, is_active FROM wa_tokens WHERE device_id=?',
      [deviceId]
    );

    let token;

    if (rows.length > 0 && rows[0].is_active === 1) {
      // ✅ Device sudah aktif → gunakan token lama
      token = rows[0].token;
      console.log('✅ Device masih aktif — memakai token lama:', token);

      // update info dasar, jangan ubah token
      await db.query(
        `UPDATE wa_tokens SET phone=?, device_name=?, updated_at=NOW()
         WHERE device_id=?`,
        [phone, name, deviceId]
      );

    } else {
      // ✅ Device baru / tidak aktif → generate token baru
      token = generateToken();
      console.log('🆕 Generate token baru:', token);

      if (rows.length > 0) {
        // device sudah ada tapi non-aktif → update
        await db.query(
          `UPDATE wa_tokens 
           SET phone=?, device_name=?, token=?, is_active=1, updated_at=NOW()
           WHERE device_id=?`,
          [phone, name, token, deviceId]
        );

      } else {
        // device belum terdaftar → insert baru
        await db.query(
          `INSERT INTO wa_tokens 
           (device_id, phone, device_name, token, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
          [deviceId, phone, name, token]
        );
      }
    }

    console.log(`✅ WhatsApp ${phone} (${name}) terhubung!`);
    console.log('🔑 Token API aktif:', token);

    // === UPDATE NAMA SETELAH 5 DETIK JIKA MASIH UNKNOWN ===
    if (name === 'Unknown Device') {
      console.log('⏳ Nama device belum diketahui, cek ulang 5 detik lagi...');
      setTimeout(async () => {
        const refreshedName =
          sock.user.verifiedName ||
          sock.user.name ||
          sock.user.pushname ||
          sock.user.platform ||
          'Unknown Device';

        if (refreshedName !== 'Unknown Device') {
          await db.query(
            'UPDATE wa_tokens SET device_name=? WHERE device_id=?',
            [refreshedName, deviceId]
          );
          console.log(`🔄 Nama device diperbarui menjadi: ${refreshedName}`);
        } else {
          console.log('⚠️ Nama device tetap tidak terdeteksi.');
        }
      }, 5000);
    }

  } catch (err) {
    console.error('❌ Gagal menyimpan token:', err.message);
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

          try {
            await fs.remove(authFolder);
            console.log('🗑️ Folder auth dihapus, siap scan QR ulang.');
          } catch (err) {
            console.error('❌ Gagal hapus folder auth:', err.message);
          }

          isConnected = false;
          lastQR = null;
          reconnecting = false;
          initWhatsApp();
        } else if (!reconnecting) {
          reconnecting = true;
          console.log('🔄 Mencoba reconnect dalam 5 detik...');
          setTimeout(() => initWhatsApp(), 5000);
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

      try {
        await db.query(
          'INSERT INTO wa_messages (number, message, type, status) VALUES (?, ?, ?, ?)',
          [sender, text, 'inbound', 'received']
        );
      } catch (err) {
        console.error('❌ Gagal simpan pesan inbound:', err.message);
      }

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

// Kirim pesan manual
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

// Ambil daftar device aktif
async function getActiveDevices() {
  try {
    const [rows] = await db.query(`
      SELECT device_id, device_name, token, expired_at, created_at, updated_at
      FROM wa_tokens
      WHERE is_active = 1
      ORDER BY updated_at DESC
    `);

    if (rows.length === 0) {
      console.log('⚠️ Tidak ada device WhatsApp yang aktif.');
    } else {
      console.log('📱 Daftar device aktif:');
      rows.forEach((d, i) => {
        console.log(`${i + 1}. ${d.device_id} (${d.device_name || 'Unknown'}) | Token: ${d.token} | Exp: ${d.expired_at}`);
      });
    }

    return rows;
  } catch (err) {
    console.error('❌ Gagal mengambil daftar devices:', err.message);
    return [];
  }
}

module.exports = { initWhatsApp, getSock, getStatus, getLastQR, sendMessage, getActiveDevices };
