const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },

  lastName: {
    type: String,
    required: true,
  },
email: {
  type: String,
  unique: true,
  sparse: true,
  lowercase: true,
  trim: true,
  match: [/\S+@\S+\.\S+/, 'Correo electrónico inválido'],
},

  password: {
    type: String,
    required: true,
  },

  idNumber: {
    type: String,
    required: true,
    unique: true,
  },

  birthDate: {
    type: Date,
    required: true,
  },

  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },

  grades: [{
    type: String,
    enum: [
      '1° grado', '2° grado', '3° grado', '4° grado', '5° grado',
      '6° grado', '7° grado', '8° grado', '9° grado',
      '1er año', '2do año', '3er año'
    ]
  }],

  phoneNumber: {
    type: String,
    required: false,
  },

  role: {
    type: String,
    enum: ['padre/madre/tutor', 'docente', 'director/a', 'administrador', 'estudiante', 'secretario/a'],
    required: true,
  },

  associatedChildren: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.role === 'padre/madre/tutor';
    },
  }],

  isActive: {
    type: Boolean,
    default: true, // ⚡ Usuarios inactivos por defecto
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 🔐 Encriptar contraseña
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// 🔑 Comparar contraseña
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);