const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },

  // 👉 CÉDULA
  cedula: {
    type: String,
    unique: true,
    sparse: true, // 👈 CLAVE para permitir múltiples null
    trim: true,
  },

  birthDate: {
    type: Date,
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
  guardian: {
    type: String, // Nombre del tutor
    required: false,
    trim: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
});

// 🔐 Encriptar contraseña
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔑 Comparar contraseña
studentSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
