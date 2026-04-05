const Notification = require('../models/Notification');
const { emitToUser } = require('./realtime');

async function createNotification(payload) {
  const notification = await Notification.create(payload);
  await notification.populate(['actor', 'task', 'team']);
  emitToUser(notification.recipient, 'notification:created', notification);
  return notification;
}

module.exports = { createNotification };
