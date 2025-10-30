const express = require('express');
const router = express.Router();
const fs = require('fs');         
const path = require('path');     
const db = require('../db');
const { getStatus, getLastQR, getSock, initWhatsApp } = require('../controller/whatsapp');

// ===================
// Dashboard
// ===================
router.get('/dashboard', async (req, res) => {
    try {
        const [outboundRows] = await db.query(
            "SELECT COUNT(*) AS total_sent FROM wa_messages WHERE type='outbound'"
        );
        const [inboundRows] = await db.query(
            "SELECT COUNT(*) AS total_received FROM wa_messages WHERE type='inbound'"
        );

        res.render('dashboard', {
            connectedDevices: getStatus() ? 1 : 0,
            messagesSent: outboundRows[0].total_sent,
            messagesReceived: inboundRows[0].total_received,
            lastQR: getLastQR()
        });
    } catch (err) {
        console.error(err);
        res.render('dashboard', {
            connectedDevices: getStatus() ? 1 : 0,
            messagesSent: 0,
            messagesReceived: 0,
            lastQR: getLastQR()
        });
    }
});

router.get('/devices', async (req, res) => {
  try {
    const sock = getSock();

    // Ambil statistik dari DB
    const [allDevices] = await db.query('SELECT COUNT(*) AS total FROM wa_tokens');
    const [connectedDevices] = await db.query('SELECT COUNT(*) AS connected FROM wa_tokens WHERE is_active = 1');
    const [users] = await db.query('SELECT COUNT(*) AS total_users FROM users');

    let deviceData = null;

    if (sock) {
      // Ambil detail device dari DB
      const [deviceRows] = await db.query(
        'SELECT device_id, phone, token FROM wa_tokens WHERE device_id=? ORDER BY created_at DESC LIMIT 1',
        [sock.user?.id]
      );

      if (deviceRows.length) {
        const row = deviceRows[0];
        deviceData = {
          id: row.device_id,
          name: sock.user?.name || 'WhatsApp Device',
          phone: row.phone || '-',
          isConnected: getStatus(),
          token: row.token,
        };
      } else {
        // fallback
        deviceData = {
          id: sock.user?.id || 'main',
          name: sock.user?.name || 'WhatsApp Device',
          phone: '-',
          isConnected: getStatus(),
          token: null,
        };
      }
    }

    res.render('devices', {
      title: 'Perangkat | Jiget',
      stats: {
        total: allDevices[0].total || 0,
        connected: connectedDevices[0].connected || 0,
        users: users[0].total_users || 0,
      },
      device: deviceData,
    });
  } catch (err) {
    console.error('Error loading devices page:', err);
    res.status(500).send('Terjadi kesalahan saat memuat halaman perangkat.');
  }
});



  

// ===================
// QR Endpoint
// ===================
router.get('/device/:id/qr', async (req, res) => {
    const qrcode = require('qrcode');
    try {
        if (getStatus()) return res.json({ connected: true, qr: null });
        const lastQR = getLastQR();
        if (!lastQR) return res.json({ connected: false, qr: null });
        const qrImage = await qrcode.toDataURL(lastQR);
        res.json({ connected: false, qr: qrImage });
    } catch (err) {
        res.status(500).json({ connected: false, qr: null, error: err.message });
    }
});

// ===================
// Disconnect Device
// ===================
router.post('/device/:id/disconnect', async (req, res) => {
  const sock = getSock();
  if (!sock) return res.json({ success: false, message: 'Device belum terhubung' });

  try {
    // Logout dari WhatsApp
    await sock.logout();

    // Reset listener lama
    sock.ev.removeAllListeners();

    // Nonaktifkan token device ini
    if (sock.user?.id) {
      await db.query('UPDATE wa_tokens SET is_active=0 WHERE device_id=?', [sock.user.id]);
    }

    // ===== 🧹 Hapus semua pesan & media =====
    const [messages] = await db.query('SELECT media_url FROM wa_messages WHERE is_media = 1');
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    for (const msg of messages) {
      if (msg.media_url) {
        const filePath = path.join(uploadsDir, msg.media_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Media dihapus: ${filePath}`);
        }
      }
    }

    await db.query('DELETE FROM wa_messages');
    console.log('🧹 Semua pesan dihapus dari database');

    // ===== 🗑️ Hapus folder auth lama supaya QR baru bisa muncul =====
    const authDir = path.join(__dirname, '../baileys_auth_info');
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
      console.log('🗑️ Folder auth lama dihapus');
    }

    // ===== 🔁 Trigger koneksi baru → QR baru =====
    initWhatsApp();

    res.json({ success: true, message: 'Device berhasil logout, data pesan dihapus, dan QR baru siap' });
  } catch (err) {
    console.error('❌ Gagal memutus device:', err);
    res.json({ success: false, message: 'Terjadi kesalahan saat memutus device' });
  }
});


module.exports = router;
