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
    cookie: { secure: false } // ganti true kalau pakai HTTPS
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.set('layout', 'layout');

// Middleware proteksi
const authRequired = require('./middlewares/auth');
app.use((req, res, next) => {
  res.locals.currentPath = req.path; // tersedia di semua view
  next();
});

app.use((req, res, next) => {
  res.locals.user = req.session.user || null; 
  next();
});
// Routes
app.use(require('./routes/auth')); // auth tidak perlu proteksi
app.use('/', authRequired, require('./routes/dashboard'));
app.use('/', authRequired, require('./routes/messages'));
app.use('/auto-reply', authRequired, require('./routes/autoReply'));

// Jalankan Server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 API Gateway berjalan di http://localhost:${PORT}`));

// Inisialisasi WhatsApp
initWhatsApp();
