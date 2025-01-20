const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Importamos bcryptjs para encriptar la contraseña
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
  password: {
    type: String,
    required: true, // El campo password es obligatorio
    minlength: 6, // Puedes ajustar la longitud mínima si es necesario
  },
});

// Middleware para encriptar la contraseña antes de guardarla
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Solo encriptar si el campo password ha sido modificado

  try {
    const salt = await bcrypt.genSalt(10); // Generamos un "salt" para la encriptación
    this.password = await bcrypt.hash(this.password, salt); // Encriptamos la contraseña
    next(); // Continuamos con el proceso de guardado
  } catch (error) {
    next(error); // Si hay un error en el proceso de encriptación, lo pasamos al siguiente middleware
  }
});

// Método para comparar la contraseña proporcionada con la almacenada en la base de datos
studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // Compara las contraseñas
};

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
