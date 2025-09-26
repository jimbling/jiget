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

/* ================================
   ✅ Redis Store (Fix untuk connect-redis v9)
================================== */
const { RedisStore } = require('connect-redis');
const { createClient } = require('redis');

const redisClient = createClient({
  socket: { host: '127.0.0.1', port: 6379 }
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));

(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis Client Connected');
  } catch (err) {
    console.error('❌ Gagal konek Redis:', err);
  }
})();

/* ================================
   🔒 Security & Performance
================================== */
app.use(
  helmet({
    hsts: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'upgrade-insecure-requests': null,
      },
    },
  })
);

app.use(compression());
app.use(morgan('dev'));

/* ================================
   🔑 Session pakai Redis
================================== */
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure:
        process.env.NODE_ENV === 'production' &&
        process.env.FORCE_HTTPS === 'true',
      maxAge: 15 * 60 * 1000,
    },
  })
);

/* ================================
   🕒 Auto Logout Middleware
================================== */
app.use((req, res, next) => {
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

/* ================================
   🏗️ Middleware & View Engine
================================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.set('layout', 'layout');

// ✅ Auth Middleware
const authRequired = require('./middlewares/auth');

// Inject data ke view
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.user = req.session.user || null;
  next();
});
app.set('trust proxy', 1);

/* ================================
   🌐 Routes
================================== */
// Route tanpa login (public)
app.use('/docs', require('./routes/docs'));

// API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Terlalu banyak request, coba lagi nanti.' },
});
app.use('/api/wa', apiLimiter, require('./routes/wa'));

// Route dengan login
app.use(require('./routes/auth'));
app.use('/', authRequired, require('./routes/dashboard'));
app.use('/', authRequired, require('./routes/messages'));
app.use('/auto-reply', authRequired, require('./routes/autoReply'));
app.use('/', authRequired, require('./routes/profile'));
app.use('/', authRequired, require('./routes/wa'));
app.use('/', authRequired, require('./routes/contacts'));
app.use('/groups', authRequired, require('./routes/groups'));
app.use('/broadcast', authRequired, require('./routes/broadcast'));

/* ================================
   ❗ Error Handler
================================== */
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

/* ================================
   🚀 Start Server
================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 API Gateway berjalan di http://localhost:${PORT}`)
);

// WhatsApp Init
initWhatsApp();

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  const { disconnectSock } = require('./controller/whatsapp');
  if (typeof disconnectSock === 'function') {
    await disconnectSock();
  }
  process.exit(0);
});
