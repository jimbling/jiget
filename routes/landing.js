const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.render('landing', {
    title: 'Selamat Datang di Jiget',
    user: req.session.user || null,
    layout: false  
  });
});

module.exports = router;
