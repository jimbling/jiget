const express = require('express');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const mysql = require('mysql2/promise');
const expressLayouts = require('express-ejs-layouts');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static('public'));

const PORT = 3000;
let sock;
let isConnected = false;
let lastQR = null;

// ======================
// Koneksi Database
// ======================
const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'db_jgateway',
});

// ======================
// Helper Token
// ======================
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

async function validateToken(token) {
    const [rows] = await db.query(
        'SELECT * FROM wa_tokens WHERE token=? AND is_active=1',
        [token]
    );
    return rows.length > 0;
}

// ======================
// Koneksi WhatsApp
// ======================
const authDir = './baileys_auth_info';

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        sock = makeWASocket({ auth: state });
        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // QR Code saat belum login
            if (qr) {
                lastQR = qr;
                console.log('📱 Scan QR berikut:');
                qrcodeTerminal.generate(qr, { small: true });
            }

            if (connection === 'open') {
                console.log('✅ WhatsApp terhubung!');
                isConnected = true;
                lastQR = null;

                // Nonaktifkan token lama device ini
                if (sock.user?.id) {
                    await db.query('UPDATE wa_tokens SET is_active=0 WHERE device_id=?', [sock.user.id]);
                }

                // Generate token baru
                const token = generateToken();
                await db.query(
                    'INSERT INTO wa_tokens (device_id, token, is_active, created_at) VALUES (?, ?, 1, NOW())',
                    [sock.user.id, token]
                );
                console.log('🔑 Token API aktif:', token);

            } else if (connection === 'close') {
                isConnected = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('❌ Session logout, harus scan ulang.');
                    // Nonaktifkan token saat logout
                    if (sock?.user?.id) {
                        await db.query('UPDATE wa_tokens SET is_active=0 WHERE device_id=?', [sock.user.id]);
                    }
                } else {
                    console.log('❌ Terputus, reconnect 5 detik...');
                    setTimeout(connectToWhatsApp, 5000);
                    // Jangan disable token, biarkan token baru tetap valid
                }
            }
        });

        sock.ev.on('messages.upsert', async ({ messages }) => {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const sender = msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            console.log(`📩 Pesan dari ${sender}: ${text}`);

            try {
                await db.query(
                    'INSERT INTO wa_messages (number, message, type, status) VALUES (?, ?, ?, ?)',
                    [sender, text, 'inbound', 'received']
                );
            } catch (err) {
                console.error('❌ Gagal simpan pesan inbound:', err.code, err.message);
            }

            if (text.toLowerCase() === 'ping') {
                try {
                    await sock.sendMessage(sender, { text: 'Pong! 🏓' });
                } catch (err) {
                    console.error('❌ Gagal membalas pesan:', err.message);
                }
            }
        });

        console.log('🚀 Socket WhatsApp siap!');
    } catch (err) {
        console.error('❌ Gagal konek ke WhatsApp:', err.message);
        setTimeout(connectToWhatsApp, 5000);
    }
}


// ======================
// API Kirim Pesan dengan token
// ======================
app.post('/api/wa/send', async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized, token required' });

    const token = authHeader.replace('Bearer ', '');
    const isValid = await validateToken(token);
    if (!isValid) return res.status(401).json({ error: 'Unauthorized, invalid token' });

    const { number, message } = req.body;
    if (!number || !message) return res.status(400).json({ error: 'number & message required' });

    if (!sock || !isConnected) return res.status(503).json({ error: 'WhatsApp client not ready' });

    try {
        await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
        await db.query(
            'INSERT INTO wa_messages (number, message, type, status) VALUES (?, ?, ?, ?)',
            [number, message, 'outbound', 'sent']
        );
        res.json({ success: true, number, message });
    } catch (err) {
        console.error('❌ Gagal kirim pesan:', err.message);
        await db.query(
            'INSERT INTO wa_messages (number, message, type, status, response) VALUES (?, ?, ?, ?, ?)',
            [number, message, 'outbound', 'failed', err.message]
        );
        res.status(500).json({ error: err.message });
    }
});


// ======================
// QR Endpoint
// ======================
app.get('/device/:id/qr', async (req, res) => {
    try {
        if (isConnected) return res.json({ connected: true, qr: null });
        if (!lastQR) return res.json({ connected: false, qr: null });

        const qrImage = await qrcode.toDataURL(lastQR);
        res.json({ connected: false, qr: qrImage });
    } catch (err) {
        res.status(500).json({ connected: false, qr: null, error: err.message });
    }
});

// ======================
// View Engine
// ======================
app.set('view engine', 'ejs');
app.set('views', './views');

// ======================
// Dashboard
// ======================
app.get('/dashboard', async (req, res) => {
    try {
        const [outboundRows] = await db.query(
            "SELECT COUNT(*) AS total_sent FROM wa_messages WHERE type='outbound'"
        );
        const [inboundRows] = await db.query(
            "SELECT COUNT(*) AS total_received FROM wa_messages WHERE type='inbound'"
        );
        res.render('dashboard', {
            connectedDevices: isConnected ? 1 : 0,
            messagesSent: outboundRows[0].total_sent,
            messagesReceived: inboundRows[0].total_received,
            lastQR
        });
    } catch (err) {
        console.error(err);
        res.render('dashboard', {
            connectedDevices: isConnected ? 1 : 0,
            messagesSent: 0,
            messagesReceived: 0,
            lastQR
        });
    }
});

// ======================
// Devices
// ======================
app.get('/devices', (req, res) => {
    res.render('devices', { device: sock ? {
        id: sock.user?.id || 'main',
        name: sock.user?.name || 'WhatsApp Device',
        isConnected
    } : null });
});

// ======================
// Messages Log dengan Pagination
// ======================
app.get('/messages', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        const [countRows] = await db.query('SELECT COUNT(*) AS total FROM wa_messages');
        const totalMessages = countRows[0].total;
        const totalPages = Math.ceil(totalMessages / limit);

        const [rows] = await db.query(
            'SELECT * FROM wa_messages ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        res.render('messages', {
            title: 'Messages Log',
            messages: rows,
            currentPage: page,
            totalPages
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error mengambil data pesan');
    }
});

// Hapus pesan
app.post('/messages/:id/delete', async (req, res) => {
    try {
        await db.query('DELETE FROM wa_messages WHERE id = ?', [req.params.id]);
        res.redirect('/messages');
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal menghapus pesan');
    }
});

// Hapus semua pesan
app.post('/messages/delete-all', async (req, res) => {
    try {
        await db.query('DELETE FROM wa_messages');
        res.redirect('/messages');
    } catch (err) {
        console.error(err);
        res.status(500).send('Gagal menghapus semua pesan');
    }
});

// ======================
// Jalankan Server
// ======================
app.listen(PORT, () => {
    console.log(`🚀 API Gateway berjalan di http://localhost:${PORT}`);
});

connectToWhatsApp();
