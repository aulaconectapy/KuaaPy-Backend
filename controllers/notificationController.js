const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json(notifications);
};

exports.markAsRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification || notification.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'No autorizado' });
  }

  notification.isRead = true;
  await notification.save();

  res.json(notification);
};