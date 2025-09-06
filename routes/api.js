const express = require('express');
const router = express.Router();
const { getSock, getStatus } = require('../whatsapp/whatsapp');
const { validateToken } = require('../whatsapp/token');
const db = require('../db');

router.post('/wa/send', async (req, res) => {
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
        await db.query('INSERT INTO wa_messages (number, message, type, status) VALUES (?, ?, ?, ?)',
            [number, message, 'outbound', 'sent']);
        res.json({ success: true, number, message });
    } catch (err) {
        await db.query('INSERT INTO wa_messages (number, message, type, status, response) VALUES (?, ?, ?, ?, ?)',
            [number, message, 'outbound', 'failed', err.message]);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
