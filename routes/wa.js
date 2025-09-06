const express = require('express');
const router = express.Router();
const { getSock } = require('../whatsapp/whatsapp');

router.post('/api/device/:id/disconnect', async (req, res) => {
    try {
        const sock = getSock();
        if (!sock) return res.json({ success: false, message: 'Device belum terhubung' });

        // matikan koneksi Baileys
        sock.ws.close(); // menutup websocket
        // reset status di memory
        sock.ev.removeAllListeners(); 

        res.json({ success: true, message: 'Device berhasil diputus' });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Gagal memutus device' });
    }
});

module.exports = router;
