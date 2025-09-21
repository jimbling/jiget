const express = require('express');
const router = express.Router();
const { User } = require('../models');
const bcrypt = require('bcrypt');

// 🔹 Halaman Edit Profile
router.get('/profile/edit', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const user = await User.findByPk(req.session.user.id);
    if (!user) return res.redirect('/login');

    res.render('edit_profile', { 
      title: 'Edit Profile | Jiget', 
      user,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error('❌ Gagal load profile:', err);
    res.redirect('/dashboard?error=profile_load');
  }
});

// 🔹 Proses Update Profile
router.post('/profile/edit', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!req.session.user) return res.redirect('/login');

    const user = await User.findByPk(req.session.user.id);
    if (!user) return res.redirect('/login');

    // Validasi sederhana
    if (!name || !email) {
      return res.redirect('/profile/edit?error=invalid_input');
    }

    user.name = name.trim();
    user.email = email.trim();

    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Sinkronkan session
    req.session.user.name = user.name;
    req.session.user.email = user.email;

    res.redirect('/profile/edit?success=1');
  } catch (err) {
    console.error('❌ Gagal update profile:', err);
    res.redirect('/profile/edit?error=1');
  }
});

module.exports = router;
