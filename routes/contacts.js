const express = require('express');
const router = express.Router();
const contactController = require('../controller/contacts');

router.get('/contacts', contactController.index);
router.get('/contacts/create', contactController.create);
router.post('/contacts', contactController.store);
router.get('/contacts/:id/edit', contactController.edit);
router.post('/contacts/bulk-delete', contactController.bulkDelete);
router.post('/contacts/:id', contactController.update);

module.exports = router;
