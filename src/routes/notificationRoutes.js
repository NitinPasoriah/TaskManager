const express = require('express');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const notificationController = require('../controllers/notificationController');
const { notificationIdParam } = require('../validators/notificationValidators');

const router = express.Router();

router.use(auth);
router.get('/', notificationController.listNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:notificationId/read', notificationIdParam, validateRequest, notificationController.markNotificationRead);

module.exports = router;
