const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');

router.get('/messages', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        const [countRows] = await db.query('SELECT COUNT(*) AS total FROM wa_messages');
        const totalMessages = countRows[0].total;
        const totalPages = Math.ceil(totalMessages / limit);

        const [rows] = await db.query(
            'SELECT * FROM wa_messages ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        res.render('messages', {
            title: 'Riwayat Pesan | Jiget',
            messages: rows,
            currentPage: page,
            totalPages
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Error mengambil data pesan');
    }
});

// Hapus pesan tertentu
router.post('/messages/:id/delete', async (req, res) => {
  try {
    const messageId = req.params.id;

    // Ambil data pesan
    const [rows] = await db.query(
      'SELECT media_url, is_media FROM wa_messages WHERE id = ?',
      [messageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesan tidak ditemukan' });
    }

    // Hapus file media jika ada
    if (rows[0].is_media && rows[0].media_url) {
      const filePath = path.join(__dirname, '..', 'uploads', rows[0].media_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ File media dihapus: ${filePath}`);
      }
    }

    // Hapus pesan dari DB
    await db.query('DELETE FROM wa_messages WHERE id = ?', [messageId]);

    return res.json({
      success: true,
      message: 'Pesan berhasil dihapus',
    });

  } catch (err) {
    console.error("❌ Gagal menghapus pesan:", err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus pesan',
    });
  }
});

// Hapus semua pesan
router.post('/messages/delete-all', async (req, res) => {
  try {
    // Ambil semua media
    const [rows] = await db.query(
      'SELECT media_url FROM wa_messages WHERE is_media = 1'
    );

    // Hapus file-file media
    rows.forEach(row => {
      if (row.media_url) {
        const filePath = path.join(__dirname, '..', 'uploads', row.media_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ File media dihapus: ${filePath}`);
        }
      }
    });

    // Hapus semua pesan dari DB
    await db.query('DELETE FROM wa_messages');

    return res.json({
      success: true,
      message: 'Semua pesan berhasil dihapus',
    });

  } catch (err) {
    console.error("❌ Gagal menghapus semua pesan:", err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus semua pesan',
    });
  }
});


module.exports = router;
