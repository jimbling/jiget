// controller/waSend.js
const { getSock, getStatus } = require('./whatsapp');
const db = require('../db');

const formatNumber = (number) => {
  let clean = number.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  return clean;
};

async function sendMessage(number, message) {
  const sock = getSock();
  const isConnected = getStatus();

  if (!sock || !isConnected) throw new Error('WhatsApp client not ready');

  const jid = `${formatNumber(number)}@s.whatsapp.net`;
  try {
    await sock.sendMessage(jid, { text: message });

    await db.query(
      'INSERT INTO wa_messages (number, message, type, status, is_media) VALUES (?, ?, ?, ?, ?)',
      [number, message, 'outbound', 'sent', 0]
    );

    return { success: true, number, message };
  } catch (err) {
    await db.query(
      'INSERT INTO wa_messages (number, message, type, status, response, is_media) VALUES (?, ?, ?, ?, ?, ?)',
      [number, message, 'outbound', 'failed', err.message, 0]
    );
    throw err;
  }
}

module.exports = { sendMessage };
