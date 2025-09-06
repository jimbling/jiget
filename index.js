const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const { initWhatsApp } = require('./whatsapp/whatsapp');

const app = express();

// 🔑 PASANG SESSION SEBELUM ROUTES
app.use(session({
    secret: 'rahasia-super-aman',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // ganti true kalau pakai HTTPS
        maxAge: 15 * 60 * 1000 // ⏳ 15 menit otomatis expire
    }
}));

// Middleware reset timer / auto logout
app.use((req, res, next) => {
    if (req.session) {
        if (!req.session.lastActivity) {
            req.session.lastActivity = Date.now();
        }

        const now = Date.now();
        const maxIdle = 15 * 60 * 1000; // 15 menit idle

        if (now - req.session.lastActivity > maxIdle) {
            req.session.destroy(() => res.redirect('/login?expired=1'));
            return;
        }

        req.session.lastActivity = now;
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.set('layout', 'layout');

// ✅ IMPORT authRequired sebelum digunakan
const authRequired = require('./middlewares/auth');

// Middleware untuk inject data ke view
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use(require('./routes/auth')); // auth tidak perlu proteksi
app.use('/', authRequired, require('./routes/dashboard'));
app.use('/', authRequired, require('./routes/messages'));
app.use('/auto-reply', authRequired, require('./routes/autoReply'));
app.use('/', authRequired, require('./routes/profile')); // ✅ route profile sekarang bisa

// Jalankan Server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 API Gateway berjalan di http://localhost:${PORT}`));

// Inisialisasi WhatsApp
initWhatsApp();
