const express = require('express');
const router = express.Router();
const fs = require('fs');         // <<< tambahkan
const path = require('path');     // <<< tambahkan
const db = require('../db');
const { getStatus, getLastQR, getSock, initWhatsApp } = require('../controller/whatsapp');

// ===================
// Dashboard stats
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

// ===================
// Devices
// ===================
router.get('/devices', async (req, res) => {
  try {
    const [devices] = await db.query(`
  SELECT id, device_id, is_active, token, expired_at, created_at, updated_at
  FROM wa_tokens
  ORDER BY created_at DESC
`);

const connectedCount = devices.filter(d => d.is_active === 1).length;

res.render('devices', {
  title: 'Perangkat | Jiget',
  devices,
  connectedDevices: connectedCount
});

  } catch (err) {
    console.error('❌ Gagal memuat data devices:', err);
    res.render('devices', {
      title: 'Perangkat | Jiget',
      devices: [],
      connectedDevices: 0
    });
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

        // Hapus folder auth lama supaya QR baru bisa muncul
        const authDir = path.join(__dirname, '../baileys_auth_info');
        if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
            console.log('🗑️ Folder auth lama dihapus');
        }

        // Trigger koneksi baru → QR baru
        initWhatsApp();

        res.json({ success: true, message: 'Device berhasil logout dan QR baru siap' });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Gagal memutus device' });
    }
});

module.exports = router;
