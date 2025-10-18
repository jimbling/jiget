const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login', { 
        layout: 'layout_guest', 
        title: 'Login | Jiget'
    });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows.length) {
      return res.render('login', { 
        layout: 'layout_guest', 
        title: 'Login | Jiget', 
        error: 'User tidak ditemukan' 
      });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { 
        layout: 'layout_guest', 
        title: 'Login | Jiget', 
        error: 'Password salah' 
      });
    }

    // Jika berhasil login
    req.session.user = { id: user.id, name: user.name };
    res.redirect('/dashboard'); 
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { 
      layout: 'layout_guest', 
      title: 'Login | Jiget', 
      error: 'Terjadi kesalahan pada server' 
    });
  }
});


router.post('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
