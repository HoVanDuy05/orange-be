const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.get('/health', testController.getHealth);

module.exports = router;
