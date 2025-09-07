const express = require('express');
const router = express.Router();
const { getSock, getStatus } = require('../whatsapp/whatsapp');
const { validateToken } = require('../whatsapp/token');
const db = require('../db');

// Kirim WA
router.post('/send', async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized, token required' });

    const token = authHeader.replace('Bearer ', '');
    if (!(await validateToken(token))) return res.status(401).json({ error: 'Unauthorized, invalid token' });

    const { number, message } = req.body;
    if (!number || !message) return res.status(400).json({ error: 'number & message required' });

    const sock = getSock();
    const isConnected = getStatus();
    if (!sock || !isConnected) return res.status(503).json({ error: 'WhatsApp client not ready' });

    try {
        await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
        await db.query(
            'INSERT INTO wa_messages (number, message, type, status) VALUES (?, ?, ?, ?)',
            [number, message, 'outbound', 'sent']
        );
        res.json({ success: true, number, message });
    } catch (err) {
        await db.query(
            'INSERT INTO wa_messages (number, message, type, status, response) VALUES (?, ?, ?, ?, ?)',
            [number, message, 'outbound', 'failed', err.message]
        );
        res.status(500).json({ error: err.message });
    }
});

// Disconnect device
router.post('/device/:id/disconnect', async (req, res) => {
    try {
        const sock = getSock();
        if (!sock) return res.json({ success: false, message: 'Device belum terhubung' });

        sock.ws.close();
        sock.ev.removeAllListeners();

        res.json({ success: true, message: 'Device berhasil diputus' });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Gagal memutus device' });
    }
});

module.exports = router;
