function authRequired(req, res, next) {
  if (!req.session.user) {
    console.log("⛔ Tidak ada sesi, blokir akses ke:", req.originalUrl);

    // Jika request dari fetch / AJAX, balas JSON
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(401).json({
        success: false,
        message: 'Sesi Anda telah berakhir. Silakan login kembali.'
      });
    }

    // Jika request biasa, redirect ke halaman login
    return res.redirect('/login');
  }
  next();
}

module.exports = authRequired;
