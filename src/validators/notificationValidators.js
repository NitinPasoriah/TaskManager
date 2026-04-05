const { param } = require('express-validator');

const notificationIdParam = [param('notificationId').isMongoId()];

module.exports = { notificationIdParam };
