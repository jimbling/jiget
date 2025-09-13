// controller/broadcast.js
const db = require('../db');
const { sendMessage } = require('../controller/waSend');

// Helper delay (ms)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runPendingBroadcasts() {
  console.log("🔄 Mengecek broadcast yang pending...");

  const [broadcasts] = await db.execute(
    `SELECT * FROM broadcasts WHERE status = 'pending' ORDER BY created_at ASC`
  );

  for (const bc of broadcasts) {
    console.log(`📢 Menjalankan broadcast: ${bc.title}`);

    // Parse target_ids menjadi array
    let ids = [];
    try {
      ids = Array.isArray(bc.target_ids)
        ? bc.target_ids
        : JSON.parse(bc.target_ids);
    } catch {
      ids = String(bc.target_ids || '')
        .split(',')
        .map(id => id.trim());
    }

    console.log("📌 Target Type:", bc.target_type);
    console.log("📌 Target IDs:", ids);

    let targetContacts = [];

    if (bc.target_type === 'group') {
      // Ambil semua kontak dari grup
      const [members] = await db.execute(
        `SELECT c.id, c.phone_number AS phone
         FROM contact_group_members m
         JOIN contacts c ON c.id = m.contact_id
         WHERE m.group_id IN (${ids.map(() => '?').join(',')})`,
        ids.map(id => Number(id))
      );
      targetContacts = members;

    } else if (bc.target_type === 'contact') {
      // Pastikan ID numerik
      const numericIds = ids.map(id => Number(id));
      if (numericIds.length > 0) {
        const [contacts] = await db.execute(
          `SELECT id, phone_number AS phone 
           FROM contacts 
           WHERE id IN (${numericIds.map(() => '?').join(',')})`,
          numericIds
        );
        targetContacts = contacts;
      }
    }

    console.log("📌 Hasil query contacts:", targetContacts);

    if (!targetContacts.length) {
      console.warn(`⚠️ Broadcast ${bc.id} tidak menemukan kontak. Skip.`);
      continue;
    }

    // Kirim ke setiap kontak dengan delay acak
    for (const [index, contact] of targetContacts.entries()) {
      try {
        await sendMessage(contact.phone, bc.message);

        await db.execute(
          `INSERT INTO broadcast_logs (broadcast_id, contact_id, status, sent_at)
           VALUES (?, ?, ?, NOW())`,
          [bc.id, contact.id, 'sent']
        );

        console.log(`✅ Pesan terkirim ke ${contact.phone}`);

        // Delay 2-4 detik sebelum kontak berikutnya
        if (index < targetContacts.length - 1) {
          const randomDelay = 2000 + Math.floor(Math.random() * 2000);
          console.log(`⏳ Delay ${randomDelay}ms sebelum kontak berikutnya...`);
          await delay(randomDelay);
        }

      } catch (err) {
        console.error(`❌ Gagal kirim ke ${contact.phone}:`, err.message || err);

        await db.execute(
          `INSERT INTO broadcast_logs (broadcast_id, contact_id, status, error_message)
           VALUES (?, ?, ?, ?)`,
          [bc.id, contact.id, 'failed', err.message || String(err)]
        );
      }
    }

    // Update status broadcast menjadi done
    await db.execute(
      `UPDATE broadcasts SET status='done', executed_at=NOW() WHERE id=?`,
      [bc.id]
    );

    console.log(`✅ Broadcast ${bc.id} selesai dijalankan.\n`);
  }
}

module.exports = { runPendingBroadcasts };
