const XLSX = require('xlsx');
const fs = require('fs');
const { Contact } = require('../models');

module.exports = {
index: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10; // jumlah data per halaman
      const offset = (page - 1) * limit;

      // Ambil data sekaligus total count
      const { count, rows } = await Contact.findAndCountAll({
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      // Jika request via AJAX (fetch), kirim JSON
      if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.json({
          success: true,
          contacts: rows,
          pagination: {
            currentPage: page,
            totalPages
          }
        });
      }

      // Render halaman biasa
      res.render('contacts/index', {
        title: 'Daftar Kontak | Jiget',
        contacts: rows,
        currentPage: page,
        totalPages
      });

    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  },

  create: async (req, res) => {
    res.render('contacts/form', { title: 'Tambah Kontak', contact: {} });
  },

  store: async (req, res) => {
    try {
      const { name, phone_number } = req.body;
      const contact = await Contact.create({ name, phone_number });
      return res.json({ success: true, message: 'Kontak berhasil ditambahkan!', contact });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal menambahkan kontak' });
    }
  },

  edit: async (req, res) => {
    try {
      const contact = await Contact.findByPk(req.params.id);
      if (!contact) return res.status(404).send('Kontak tidak ditemukan');
      res.render('contacts/form', { title: 'Edit Kontak', contact });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  },

  update: async (req, res) => {
    try {
      const contact = await Contact.findByPk(req.params.id);
      if (!contact) return res.status(404).send('Kontak tidak ditemukan');
      await contact.update({ name: req.body.name, phone_number: req.body.phone_number });
      return res.json({ success: true, message: 'Kontak berhasil diupdate' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal update kontak' });
    }
  },

  bulkDelete: async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada kontak yang dipilih' });
      }
      await Contact.destroy({ where: { id: ids } });
      return res.json({ success: true, message: `${ids.length} kontak berhasil dihapus` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Gagal menghapus kontak' });
    }
  }
};


module.exports.import = async (req, res) => {
  try {
    if (!req.file) {
      console.error('❌ Tidak ada file dikirim!');
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }

    console.log(`📂 Membaca file: ${req.file.path}`);

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    console.log('📑 Sheet ditemukan:', sheetName);

    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`📊 Jumlah baris terbaca: ${sheet.length}`);

    let contacts = [];
    for (let row of sheet) {
      console.log('➡️ Row:', row);
      if (!row.Nama || !row.Nomor) {
        console.warn('⚠️ Baris dilewati karena tidak ada Nama/Nomor:', row);
        continue;
      }
      contacts.push({
        name: row.Nama,
        phone_number: String(row.Nomor).replace(/\D/g, '')
      });
    }

    console.log(`✅ Total kontak yang akan disimpan: ${contacts.length}`);

    await Contact.bulkCreate(contacts);
    fs.unlinkSync(req.file.path);

    return res.json({ success: true, count: contacts.length });

  } catch (err) {
    console.error('💥 ERROR saat import:', err);
    return res.status(500).json({ success: false, message: 'Gagal import kontak', error: err.message });
  }
};



