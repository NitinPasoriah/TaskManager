const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .populate('actor task team', 'name email title kind');

  res.json({
    success: true,
    data: notifications
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.notificationId);
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this notification');
  }

  notification.read = true;
  await notification.save();

  res.json({
    success: true,
    data: notification
  });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllRead
};
