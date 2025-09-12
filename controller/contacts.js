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
        title: 'Daftar Kontak',
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
