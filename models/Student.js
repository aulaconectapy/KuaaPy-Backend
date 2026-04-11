const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  // Información básica del estudiante
  firstName: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true,
  },
  sex: {
    type: String,
    enum: ['Masculino', 'Femenino'],
    required: [false, 'El sexo es obligatorio'],
  },
  cedula: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  birthDate: {
    type: Date,
    required: [true, 'La fecha de nacimiento es obligatoria'],
  },
  institution: {
    type: Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'La institución es obligatoria'],
  },
  grade: {
    type: String,
    required: [true, 'El grado es obligatorio'],
  },

  // Información de los padres/tutores
  father: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  mother: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  guardian: {
    type: String, // Nombre de tutor alternativo, si aplica
    trim: true,
  },

  // Salud y necesidades especiales
  allergies: { type: String, trim: true }, // e.g., "Maní, lácteos"
  healthIssues: { type: String, trim: true }, // e.g., "Problemas de visión, hipersensibilidad auditiva"
  reasonableAdjustments: { type: String, trim: true }, // ajustes razonables solicitados por la familia

  // Información adicional
  address: { type: String, trim: true },
  observations: { type: String, trim: true }, // comentarios adicionales sobre el alumno

  // Relación con usuarios y auditoría
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario creador es obligatorio'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
// CAMPOS PARA SINCRONIZACIÓN
  sincronizado: { 
    type: Boolean, 
    default: false, 
    index: true // Índice para que el script de subida sea ultra rápido
  },
  lastModified: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true }); // Asegúrate de tener timestamps en todos


module.exports = mongoose.model('Student', studentSchema);