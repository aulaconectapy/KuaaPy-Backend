const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dailyReportSchema = new Schema({

  student: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },

  institution: {
    type: Schema.Types.ObjectId,
    ref: "Institution",
    required: true
  },

  grade: {
    type: String,
    required: true
  },

  teacher: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  tasksCompleted: {
    type: Boolean,
    default: false
  },

  participation: {
    type: String,
    enum: ["excelente", "buena", "regular", "baja"],
    default: "buena"
  },

  behavior: {
    type: String,
    enum: ["excelente", "bueno", "regular", "malo"],
    default: "bueno"
  },

  observation: {
    type: String
  }

});

module.exports = mongoose.model("DailyReport", dailyReportSchema);