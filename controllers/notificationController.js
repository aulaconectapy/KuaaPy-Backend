const Notification = require("../models/Notification");

exports.getMyNotifications = async (req, res) => {

  try {

    const notifications = await Notification.find({
      user: req.user.userId
    })
    .sort({ createdAt: -1 })
    .limit(20);

    res.json(notifications);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};


exports.markAsRead = async (req, res) => {

  try {

    const notification = await Notification.findByIdAndUpdate(

      req.params.id,

      { read: true },

      { new: true }

    );

    res.json(notification);

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

};