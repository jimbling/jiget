const crypto = require('crypto');
const db = require('../db');

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

module.exports = { generateToken, validateToken };
