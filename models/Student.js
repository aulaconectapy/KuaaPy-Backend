const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  birthDate: {
    type: Date,
    required: true,
  },
  institution: {
    type: Schema.Types.ObjectId,
    ref: 'Institution', // Referencia a la institución
    required: true,
  },
  grade: {
    type: String,
    required: true, // Se obtendrá desde la API de Institution
  },
  guardian: {
    type: String, // Nombre del padre/madre/tutor
    required: false, // No es obligatorio
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User', // ID del usuario que creó el registro
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
