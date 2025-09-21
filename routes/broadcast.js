const express = require('express');
const router = express.Router();
const db = require('../db');
const { runPendingBroadcasts } = require('../controller/broadcast');

// ================== Halaman daftar broadcast ==================
router.get('/', async (req, res) => {
  const PER_PAGE = 5; 
  let page = parseInt(req.query.page) || 1;
  if (page < 1) page = 1;

  // Hitung total broadcast
  const [countRows] = await db.execute(`SELECT COUNT(*) AS total FROM broadcasts`);
  const totalItems = countRows[0].total;
  const totalPages = Math.ceil(totalItems / PER_PAGE);

  const offset = (page - 1) * PER_PAGE;

  // Gunakan template literal untuk LIMIT dan OFFSET
  const [broadcasts] = await db.execute(
    `SELECT * FROM broadcasts ORDER BY created_at DESC LIMIT ${PER_PAGE} OFFSET ${offset}`
  );

  res.render('broadcast/index', { 
    title: 'Broadcast | Jiget', 
    broadcasts,
    currentPage: page,
    totalPages
  });
});




// ================== Halaman form create broadcast ==================
router.get('/create', async (req, res) => {
  const [groups] = await db.execute('SELECT * FROM contact_groups');
  const [contacts] = await db.execute('SELECT * FROM contacts');
  res.render('broadcast/create', { title: 'Buat Broadcast | Jiget', groups, contacts });
});

// ================== Simpan & jalankan broadcast baru ==================
// POST /broadcast
router.post('/', async (req, res) => {
  const { title, message, target_type, target_ids } = req.body;

  const [result] = await db.execute(
    `INSERT INTO broadcasts (title, message, status, target_type, target_ids, created_at)
     VALUES (?, ?, 'pending', ?, CAST(? AS JSON), NOW())`,
    [title, message, target_type, JSON.stringify(target_ids)]
  );

  const broadcastId = result.insertId;

  try {
    runPendingBroadcasts(); // Jangan tunggu di sini, biarkan async
  } catch (err) {
    console.error('Broadcast error:', err);
  }

  // Jika request AJAX → kirim JSON, jika biasa → redirect
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    res.json({ success: true, broadcast_id: broadcastId });
  } else {
    res.redirect('/broadcast');
  }
});


// ================== Eksekusi broadcast pending ==================
router.post('/run', async (req, res) => {
  try {
    await runPendingBroadcasts();
    res.redirect('/broadcast');
  } catch (e) {
    console.error("Gagal menjalankan broadcast:", e);
    res.status(500).send("Gagal menjalankan broadcast");
  }
});

// ================== Detail logs broadcast ==================
// Letakkan route spesifik sebelum route dinamis lain
router.get('/:id/logs', async (req, res) => {
  const broadcastId = req.params.id;

  // Optional: pastikan broadcastId adalah angka
  if (isNaN(broadcastId)) {
    return res.status(400).json({ error: 'ID broadcast tidak valid' });
  }

  try {
    const [logs] = await db.execute(
      `SELECT l.*, c.name AS contact_name, c.phone_number AS phone
       FROM broadcast_logs l
       JOIN contacts c ON c.id = l.contact_id
       WHERE l.broadcast_id = ?
       ORDER BY l.sent_at ASC`,
      [broadcastId]
    );

    res.json({ logs });
  } catch (err) {
    console.error('Gagal load logs:', err);
    res.status(500).json({ error: 'Gagal memuat logs' });
  }
});

// ================== Status broadcast ==================
router.get('/:id/status', async (req, res) => {
  const [rows] = await db.execute(
    `SELECT status FROM broadcasts WHERE id=? LIMIT 1`,
    [req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Broadcast tidak ditemukan' });
  }

  res.json({ status: rows[0].status });
});


// ================== Hapus semua broadcast ==================
router.delete('/delete-all', async (req, res) => {
  try {
    await db.execute('DELETE FROM broadcast_logs');
    await db.execute('DELETE FROM broadcasts');
    res.json({ success: true, message: 'Semua broadcast berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal menghapus broadcast' });
  }
});


module.exports = router;
