const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  message: String,

  type: {
    type: String,
    enum: ["discipline-alert"]
  },

  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DisciplineReport"
  },

  read: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);