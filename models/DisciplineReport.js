const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const disciplineReportSchema = new Schema({

  student: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },

  // usuario del estudiante (login del alumno)
  studentUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
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

  // docente que creó el reporte
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  // gravedad
  severity: {
    type: String,
    enum: ["Leve", "Moderado", "Grave"],
    default: "Leve"
  },

  faultType: {
    type: String,
    enum: [
      "Falta de respeto al compañero",
      "Falta de respeto al docente",
      "Pelea",
      "Interrupción de clase",
      "Tarea no realizada",
      "Uso indebido de materiales",
      "Habla mucho en clases",
      "Grita en la clase",
      "Otro"
    ],
    required: true
  },

  description: {
    type: String,
    required: true
  },

  actionTaken: {
    type: String
  },

  observation: {
    type: String
  },

  // estado del reporte
  status: {
    type: String,
    enum: [
      "Pendiente",
      "Visto por padres",
      "Atendido",
      "Cerrado"
    ],
    default: "Pendiente"
  },

  // ================================
  // CONFIRMACIÓN DE PADRES
  // ================================

  parentReviewed: {
    type: Boolean,
    default: false
  },

  parentReviewedAt: {
    type: Date
  },

  parentName: {
    type: String
  },

  parentRelation: {
    type: String,
    enum: ["Padre", "Madre", "Tutor/a"]
  },

  parentUser: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },

  // ================================
  // NOTIFICACIÓN
  // ================================

  isNotified: {
    type: Boolean,
    default: false
  },

  // ================================
  // EDICIÓN DEL REPORTE
  // ================================

  edited: {
    type: Boolean,
    default: false
  },

  editedAt: {
    type: Date
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

module.exports = mongoose.model("DisciplineReport", disciplineReportSchema);