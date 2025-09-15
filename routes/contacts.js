const express = require('express');
const router = express.Router();
const contactController = require('../controller/contacts');
const multer = require('multer');
const path = require('path');

// ===== Konfigurasi Multer =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });


router.post('/contacts/import',
  (req, res, next) => {
    console.log('📝 Incoming upload...');
    next();
  },
  upload.single('file'),
  (req, res, next) => {
    console.log('📄 File diterima:', req.file ? req.file.fieldname : 'tidak ada');
    console.log('📄 Path:', req.file?.path);
    next();
  },
  contactController.import
);

// ===== ROUTES =====
router.get('/contacts', contactController.index);
router.get('/contacts/create', contactController.create);
router.post('/contacts', contactController.store);
router.get('/contacts/:id/edit', contactController.edit);
router.post('/contacts/bulk-delete', contactController.bulkDelete);
router.post('/contacts/:id', contactController.update);




router.get('/contacts/template', (req, res) => {
  const XLSX = require('xlsx');
  const sampleData = [
    { Nama: "Budi Santoso", Nomor: "081234567890" },
    { Nama: "Siti Aminah", Nomor: "082345678901" },
    { Nama: "Agus Pratama", Nomor: "083456789012" },
    { Nama: "Dewa Putra", Nomor: "+6285123456789" },
    { Nama: "Mega Lestari", Nomor: "081987654321" }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=template_kontak.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

module.exports = router;
