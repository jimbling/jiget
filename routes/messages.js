const express = require('express');
const router = express.Router();
const db = require('../db');

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
            title: 'Riwayat Pesan',
            messages: rows,
            currentPage: page,
            totalPages
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Error mengambil data pesan');
    }
});

// Hapus pesan
router.post('/messages/:id/delete', async (req, res) => {
    try {
        await db.query('DELETE FROM wa_messages WHERE id = ?', [req.params.id]);
        res.redirect('/messages');
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal menghapus pesan');
    }
});

// Hapus semua pesan
router.post('/messages/delete-all', async (req, res) => {
    try {
        await db.query('DELETE FROM wa_messages');
        res.redirect('/messages');
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal menghapus semua pesan');
    }
});

module.exports = router;
