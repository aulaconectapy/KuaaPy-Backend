const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const behaviorReportSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },

  institution: {
    type: Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },

  grade: {
    type: String,
    required: true,
  },

  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  behaviorType: {
    type: String,
    enum: ['Positivo', 'Negativo', 'Observación'],
    required: true,
  },

  // 🆕 TIPO DE FALTA
  faultType: {
    type: String,
    enum: ['Leve', 'Grave', 'Muy grave'],
    required: function () {
      return this.behaviorType === 'Negativo';
    },
  },

  description: {
    type: String,
    required: true,
    trim: true,
  },

  // 🆕 ESTADO DE VISTO POR EL PADRE
  status: {
    type: String,
    enum: ['Pendiente', 'Visto'],
    default: 'Pendiente',
  },

  // 🆕 FECHA EN QUE EL PADRE LO VIO
  viewedAt: {
    type: Date,
    default: null,
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('BehaviorReport', behaviorReportSchema);