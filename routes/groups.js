const express = require('express');
const router = express.Router();
const groupController = require('../controller/group');

router.get('/', groupController.index);
router.post('/save', groupController.saveGroup); 
router.post('/:id/delete', groupController.destroy); 
router.post('/:id/members/remove', groupController.removeMember); 

module.exports = router;
