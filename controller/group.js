const db = require('../db');

exports.index = async (req, res) => {
  const [groups] = await db.execute('SELECT * FROM contact_groups ORDER BY created_at DESC');
  const [contacts] = await db.execute('SELECT id, name FROM contacts ORDER BY name ASC');

  const [members] = await db.execute(`
    SELECT m.group_id, c.id AS contact_id, c.name
    FROM contact_group_members m
    JOIN contacts c ON m.contact_id = c.id
  `);

  const groupMembers = {};
  members.forEach(m => {
    if (!groupMembers[m.group_id]) groupMembers[m.group_id] = [];
    groupMembers[m.group_id].push({ id: m.contact_id, name: m.name });
  });

  res.render('groups', { groups, contacts, groupMembers });
};

// Controller saveGroup
exports.saveGroup = async (req, res) => {
  try {
    console.log('📩 saveGroup req.body:', req.body); // Debug log

    const { group_id, name, contact_ids } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Nama grup wajib diisi' });
    }

    let group;
    if (group_id) {
      await db.execute('UPDATE contact_groups SET name=? WHERE id=?', [name, group_id]);
      group = { id: group_id, name };
      await db.execute('DELETE FROM contact_group_members WHERE group_id=?', [group_id]);
    } else {
      const [result] = await db.execute('INSERT INTO contact_groups (name) VALUES (?)', [name]);
      group = { id: result.insertId, name };
    }

    // Simpan anggota (jika ada)
    if (Array.isArray(contact_ids) && contact_ids.length) {
      const placeholders = contact_ids.map(() => '(?, ?)').join(', ');
      const flatValues = contact_ids.flatMap(cid => [group.id, cid]);

      await db.execute(
        `INSERT INTO contact_group_members (group_id, contact_id) VALUES ${placeholders}`,
        flatValues
      );
    }

    // Ambil ulang anggota
    const [members] = await db.execute(
      `SELECT c.id, c.name
       FROM contact_group_members m
       JOIN contacts c ON m.contact_id = c.id
       WHERE m.group_id = ?`,
      [group.id]
    );

    return res.json({
      success: true,
      message: 'Grup berhasil disimpan',
      group,
      members
    });

  } catch (error) {
    console.error('🔥 saveGroup Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyimpan grup'
    });
  }
};





// ✅ Hapus grup (JSON response)
exports.destroy = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM contact_groups WHERE id=?', [id]);
    await db.execute('DELETE FROM contact_group_members WHERE group_id=?', [id]);
    res.json({ success: true, message: 'Grup berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal menghapus grup' });
  }
};

// ✅ Hapus member dari grup (JSON response)
exports.removeMember = async (req, res) => {
  try {
    const { id } = req.params; // group_id
    const { contact_id } = req.body;
    await db.execute('DELETE FROM contact_group_members WHERE contact_id=? AND group_id=?', [contact_id, id]);
    res.json({ success: true, message: 'Member dihapus dari grup' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal menghapus member' });
  }
};
