require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initWhatsApp } = require('./controller/whatsapp');

const app = express();

const multer = require('multer');
const upload = multer();

app.use(upload.none());

// 🔒 Security & Performance
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// 🔑 Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000
    }
}));

// 🕒 Auto logout middleware
app.use((req, res, next) => {
  // skip docs publik
    if (req.path.startsWith('/docs')) return next();

    if (req.session) {
        if (!req.session.lastActivity) req.session.lastActivity = Date.now();

        const now = Date.now();
        const maxIdle = 30 * 60 * 1000;

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

// Route tanpa Autentikasi Login, bisa di akses Publik
app.use('/docs', require('./routes/docs'));

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.set('layout', 'layout');

app.use(expressLayouts);
// ✅ Auth Middleware
const authRequired = require('./middlewares/auth');

// Inject data ke view
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  next();
});
app.set('trust proxy', 1);
// Rate Limit API WA
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Terlalu banyak request, coba lagi nanti.' }
});
app.use('/api/wa', apiLimiter, require('./routes/wa'));

// Route lainnya
app.use(require('./routes/auth'));
app.use('/', authRequired, require('./routes/dashboard'));
app.use('/', authRequired, require('./routes/messages'));
app.use('/auto-reply', authRequired, require('./routes/autoReply'));
app.use('/', authRequired, require('./routes/profile'));
app.use('/', authRequired, require('./routes/wa'));
app.use('/', authRequired, require('./routes/contacts'));
app.use('/groups', authRequired, require('./routes/groups'));
app.use('/broadcast', authRequired, require('./routes/broadcast'));


// Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Gateway berjalan di http://localhost:${PORT}`));

// WhatsApp Init
initWhatsApp();


// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  const { disconnectSock } = require('./whatsapp/whatsapp');
  await disconnectSock();
  process.exit(0);
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  const { disconnectSock } = require('./whatsapp/whatsapp');
  await disconnectSock();
  process.exit(0);
});
