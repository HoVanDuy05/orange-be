const express = require('express');
const router = express.Router();
const PushController = require('../controllers/pushController');

/**
 * @swagger
 * /push/subscribe:
 *   post:
 *     summary: Subscribe to Push Notifications
 *     tags: [Push]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer_phone:
 *                 type: string
 *               subscription:
 *                 type: object
 */
router.post('/subscribe', (req, res) => PushController.subscribe(req, res));

module.exports = router;
