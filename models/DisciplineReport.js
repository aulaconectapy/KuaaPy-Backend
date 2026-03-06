const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const disciplineReportSchema = new Schema({

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

  faultType: {
    type: String,
    enum: [
      "falta de respeto",
      "pelea",
      "interrupción de clase",
      "tarea no realizada",
      "uso indebido de materiales",
      "otro"
    ],
    required: true
  },

  description: {
    type: String,
    required: true
  },

  actionTaken: {
    type: String
  }

});

module.exports = mongoose.model("DisciplineReport", disciplineReportSchema);