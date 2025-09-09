const express = require('express');
const router = express.Router();

// Daftar halaman dokumentasi
const pages = ['pendahuluan','send-text','send-media','disconnect-device','tips'];

// Halaman /docs → tampilkan langsung Pendahuluan
router.get('/', (req, res) => {
  res.render('docs/pendahuluan', {
    title: 'Dokumentasi - Pendahuluan',
    layout: 'docs/layout-docs'
  });
});

// Halaman docs spesifik, misal /docs/send-text
router.get('/:page', (req, res) => {
  const page = req.params.page;

  // Jika halaman tidak ada, tampilkan 404
  if (!pages.includes(page)) return res.status(404).send('Halaman tidak ditemukan');

  res.render(`docs/${page}`, {
    title: `Dokumentasi - ${page}`,
    layout: 'docs/layout-docs'
  });
});

module.exports = router;
