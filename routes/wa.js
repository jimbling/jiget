const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { getSock, getStatus } = require('../whatsapp/whatsapp');
const { validateToken } = require('../whatsapp/token');
const db = require('../db');


// === CONFIG MULTER UNTUK TERIMA FILE ===
const upload = multer({ dest: 'uploads/' });

// ==================== ROUTE: KIRIM TEKS ====================
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

        // ✅ log ke database (teks biasa → is_media = 0)
        await db.query(
            'INSERT INTO wa_messages (number, message, type, status, is_media) VALUES (?, ?, ?, ?, ?)',
            [number, message, 'outbound', 'sent', 0]
        );

        res.json({ success: true, number, message });
    } catch (err) {
        // ❌ kalau gagal, tetap log ke DB + response error
        await db.query(
            'INSERT INTO wa_messages (number, message, type, status, response, is_media) VALUES (?, ?, ?, ?, ?, ?)',
            [number, message, 'outbound', 'failed', err.message, 0]
        );

        res.status(500).json({ error: err.message });
    }
});



// ==================== ROUTE: KIRIM MEDIA ====================
router.post('/send-media', upload.single('file'), async (req, res) => {
    console.log("📥 /send-media dipanggil");
    try {
        const authHeader = req.headers['authorization'];
        console.log("🔑 Authorization Header:", authHeader);

        if (!authHeader) return res.status(401).json({ error: 'Unauthorized, token required' });

        const token = authHeader.replace('Bearer ', '');
        const valid = await validateToken(token);
        console.log("✅ Token valid?", valid);

        if (!valid) return res.status(401).json({ error: 'Unauthorized, invalid token' });

        console.log("📦 req.body:", req.body);
        console.log("📂 req.file:", req.file);

        const { number, caption } = req.body;
        if (!number || !req.file) {
            console.log("❌ number atau file tidak ada");
            return res.status(400).json({ error: 'number & file required' });
        }

        const sock = getSock();
        const isConnected = getStatus();
        console.log("📡 isConnected:", isConnected);

        if (!sock || !isConnected) return res.status(503).json({ error: 'WhatsApp client not ready' });

        // Ambil ekstensi asli file (contoh: .jpg, .png)
        const ext = path.extname(req.file.originalname);
        const newFilename = req.file.filename + ext;

        // Pindahkan file ke folder publik dengan ekstensi
        const oldPath = path.join(__dirname, '..', req.file.path);
        const publicUploads = path.join(__dirname, '..', 'public', 'uploads');

        if (!fs.existsSync(publicUploads)) {
            fs.mkdirSync(publicUploads, { recursive: true });
        }

        const newPath = path.join(publicUploads, newFilename);
        fs.renameSync(oldPath, newPath);
        console.log("📦 File dipindahkan ke:", newPath);

        // Kirim media ke WA
        const fileBuffer = fs.readFileSync(newPath);
        console.log("📄 File berhasil dibaca, size:", fileBuffer.length);

        console.log("📤 Mengirim ke:", number);
        await sock.sendMessage(`${number}@s.whatsapp.net`, {
            image: fileBuffer,
            caption: caption || ''
        });

        // Simpan log ke database dengan nama file yang sudah ada ekstensi
        const mediaUrl = `${newFilename}`;

        await db.query(
            'INSERT INTO wa_messages (number, message, media_url, type, is_media, status) VALUES (?, ?, ?, ?, ?, ?)',
            [
                number,
                caption || '(media tanpa caption)',
                mediaUrl,
                'outbound',
                1,
                'sent'
            ]
        );

        res.json({
            success: true,
            number,
            caption,
            media_url: mediaUrl
        });

    } catch (err) {
        console.error("❌ ERROR SEND-MEDIA:", err);
        res.status(500).json({ error: err.message });
    }
});


// ==================== DISCONNECT DEVICE ====================
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
