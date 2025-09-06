const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login', { 
        layout: 'layout_guest', 
        title: 'Login'
    });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows.length) return res.render('login', { error: 'User tidak ditemukan' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: 'Password salah' });

    req.session.user = { id: user.id, name: user.name };
    res.redirect('/dashboard'); 
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
