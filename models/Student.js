const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
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

  guardian: {
    type: String,
    trim: true,
  },

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
});

module.exports = mongoose.model('Student', studentSchema);