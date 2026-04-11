const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definir el esquema para la institución
const institutionSchema = new Schema({
  name: {
    type: String,
    required: [true, 'El campo "Nombre" es obligatorio.'],
    unique: true,
  },
  number: {
    type: String,
    required: [true, 'El campo "Número" es obligatorio.'],
    unique: true,
    validate: {
      validator: function(value) {
        return /^\d+$/.test(value); // Validación para asegurarse de que solo contenga números
      },
      message: 'El campo "Número" debe ser solo numérico.',
    },
  },
  address: {
    type: String,
    required: [true, 'El campo "Dirección" es obligatorio.'],
  },
  phoneNumber: {
    type: String,
    required: false, // Esto es opcional
    validate: {
      validator: function(value) {
        return /^(\+?\d{1,4}[-\s]?)?(\(?\d{2,3}\)?[-\s]?)?\d{4}[-\s]?\d{4}$/.test(value); // Validación simple de teléfono
      },
      message: 'El número de teléfono no es válido.',
    },
  },
  director: {
    type: String,
    required: false, // Esto es opcional
  },
  secretary: {
    type: String,
    required: false, // Esto es opcional
  },
  grades: {
    type: [String],
    enum: [
      '1° grado', '2° grado', '3° grado', '4° grado', '5° grado',
      '6° grado', '7° grado', '8° grado', '9° grado', '1er año', 
      '2do año', '3er año',
    ],
    required: [true, 'El campo "grados" es obligatorio.'],
    validate: {
      validator: function(value) {
        return value.length > 0; // Asegura que al menos un grado haya sido seleccionado
      },
      message: 'Debe seleccionar al menos un grado.',
    },
  },
  logoUrl: {
    type: String,
    required: false, // El campo logoUrl es opcional
    validate: {
      validator: function(value) {
        return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif))$/.test(value); // Validación simple de URL de imagen
      },
      message: 'La URL del logo debe ser una imagen válida (png, jpg, jpeg, gif).',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
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

// Crear y exportar el modelo
const Institution = mongoose.model('Institution', institutionSchema);
module.exports = Institution;
