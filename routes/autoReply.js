const express = require('express');
const router = express.Router();
const db = require('../db');

// Halaman UI Auto-Reply
router.get('/', async (req, res) => {
    const [autoReplies] = await db.query('SELECT * FROM auto_replies ORDER BY id DESC');
    res.render('auto_replies', { autoReplies });
});

// Tambah Auto-Reply
router.post('/', async (req, res) => {
    const { keyword, type, reply_text } = req.body;
    await db.query('INSERT INTO auto_replies (keyword, type, reply_text) VALUES (?, ?, ?)',
        [keyword, type, reply_text]
    );
    res.redirect('/auto-replies');
});

// Edit Auto-Reply
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { keyword, type, reply_text } = req.body;
    await db.query('UPDATE auto_replies SET keyword=?, type=?, reply_text=? WHERE id=?',
        [keyword, type, reply_text, id]
    );
    res.json({ success: true });
});

// Hapus Auto-Reply
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    await db.query('DELETE FROM auto_replies WHERE id=?', [id]);
    res.json({ success: true });
});

// Toggle aktif/nonaktif
router.post('/:id/toggle', async (req, res) => {
    const { id } = req.params;
    await db.query('UPDATE auto_replies SET is_active = 1 - is_active WHERE id=?', [id]);
    res.json({ success: true });
});

module.exports = router;
