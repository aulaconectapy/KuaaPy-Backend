const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

// Definir el esquema para el usuario
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
    required: true,
    unique: true,
    match: [/\S+@\S+\.\S+/, 'Por favor ingrese un correo electrónico válido'], // Validación de correo
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
    ref: 'Institution', // Asociar con el modelo de Institución
    required: true,
  },
  grade: {
    type: String,
    enum: ['1° grado', '2° grado', '3° grado', '4° grado', '5° grado', '6° grado', '7° grado', '8° grado', '9° grado', '1er año', '2do año', '3er año'],
    required: function () {
      return this.role === 'docente' || this.role === 'padre/madre/tutor'; // Si es docente o padre, se requiere grado
    },
  },
  phoneNumber: {
    type: String,
    required: false, // Teléfono opcional
  },
  role: {
    type: String,
    enum: ['padre/madre/tutor', 'docente', 'director/a', 'administrador', 'estudiante'],
    required: true,
  },
  associatedInstitution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: function () {
      return this.role === 'docente' || this.role === 'director/a' || this.role === 'estudiante'; // Asociar a la institución para estos roles
    },
    required: false
  },
  associatedChildren: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.role === 'padre/madre/tutor'; // Los padres/madres/tutores están asociados a hijos
    },
  }],
  isActive: {
    type: Boolean,
    default: false, // Inicialmente, el usuario no está habilitado para login
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware para encriptar la contraseña antes de guardar el usuario
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Método para comparar la contraseña
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
