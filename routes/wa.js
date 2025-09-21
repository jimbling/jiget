const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { getSock, getStatus } = require('../controller/whatsapp');
const { validateToken } = require('../controller/token');
const db = require('../db');


// === CONFIG MULTER UNTUK TERIMA FILE ===
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.pdf', '.docx', '.zip', '.rar'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Ekstensi file tidak diizinkan'));
    }
  }
});

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

       
        await db.query(
            'INSERT INTO wa_messages (number, message, type, status, is_media) VALUES (?, ?, ?, ?, ?)',
            [number, message, 'outbound', 'sent', 0]
        );

        res.json({ success: true, number, message });
    } catch (err) {
       
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

    if (!sock || !isConnected)
      return res.status(503).json({ error: 'WhatsApp client not ready' });

    // Ambil ekstensi asli file
    const ext = path.extname(req.file.originalname).toLowerCase();
    const newFilename = req.file.filename + ext;

    // Pindahkan file ke folder publik
    const oldPath = path.join(__dirname, '..', req.file.path);
    const publicUploads = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(publicUploads)) fs.mkdirSync(publicUploads, { recursive: true });

    const newPath = path.join(publicUploads, newFilename);
    fs.renameSync(oldPath, newPath);
    console.log("📦 File dipindahkan ke:", newPath);

    const fileBuffer = fs.readFileSync(newPath);
    console.log("📄 File berhasil dibaca, size:", fileBuffer.length);

    // Tentukan tipe media berdasarkan ekstensi
    let messageOptions = { caption: caption || '' };
    let mediaType = 'document'; // default

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      messageOptions.image = fileBuffer;
      mediaType = 'image';
    } else if (['.mp4', '.mov'].includes(ext)) {
      messageOptions.video = fileBuffer;
      mediaType = 'video';
    } else {
      messageOptions.document = fileBuffer;
      messageOptions.fileName = req.file.originalname;
      messageOptions.mimetype = req.file.mimetype;
      mediaType = 'document';
    }

    console.log(`📤 Mengirim ${mediaType} ke:`, number);
    await sock.sendMessage(`${number}@s.whatsapp.net`, messageOptions);

    // Simpan log ke database
    const mediaUrl = `${newFilename}`;
    await db.query(
  'INSERT INTO wa_messages (number, message, media_url, type, media_type, is_media, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
  [
    number,
    caption || '(media tanpa caption)',
    mediaUrl,
    'outbound',        
    'document',        
    1,
    'sent'
  ]
);


    res.json({
      success: true,
      number,
      caption,
      media_url: mediaUrl,
      type: mediaType
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

// ===================== HALAMAN KIRIM TEKS & MEDIA ====================

router.get('/send-text', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT token 
      FROM wa_tokens 
      WHERE is_active = 1 
      ORDER BY id DESC 
      LIMIT 1
    `);

    if (!rows.length) return res.status(500).send('Token WA belum tersedia');

    const token = rows[0].token;
    res.render('send-text', { token }); // <-- pastikan ada { token }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


// Route halaman kirim media
router.get('/send-media', async (req, res) => {
  try {
    // Ambil token aktif dari database
    const [rows] = await db.query(`
      SELECT token 
      FROM wa_tokens 
      WHERE is_active = 1 
      ORDER BY id DESC 
      LIMIT 1
    `);

    if (!rows.length) return res.status(500).send('Token WA belum tersedia');

    const token = rows[0].token;

    // Definisikan batasan file
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'pdf', 'docx','zip','rar'];
    const maxFileSizeMB = 10; // 10 MB

    // Render EJS dengan token dan info batasan file
    res.render('send-media', {
      token,
      allowedExtensions,
      maxFileSizeMB
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});




module.exports = router;
