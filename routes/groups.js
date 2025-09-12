const express = require('express');
const router = express.Router();
const groupController = require('../whatsapp/group');

router.get('/', groupController.index);
router.post('/save', groupController.saveGroup); // Tambah/update grup + anggota
router.post('/:id/delete', groupController.destroy); // Hapus grup
router.post('/:id/members/remove', groupController.removeMember); // Hapus member dari grup

module.exports = router;
