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
  },

sincronizado: { 
    type: Boolean, 
    default: false, 
    index: true 
  },
  lastModified: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);