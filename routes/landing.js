const express = require('express');
const router = express.Router();

// Halaman landing page
router.get('/', (req, res) => {
  res.render('landing', {
    title: 'Selamat Datang di Jiget',
    user: req.session.user || null
  });
});

module.exports = router;
