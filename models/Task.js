const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  subject: { type: String, required: true },
  capacities: [{ type: String, required: true }],
  topic: { type: String, required: true },

  // NUEVOS CAMPOS
  consigna: { type: String, required: false }, // instrucción de la actividad
  observacion: { type: String, default: '' }, // comentario opcional

  // FUNCIÓN DE LA EVALUACIÓN
  taskType: {
    type: String,
    enum: ['diagnostico', 'formativo', 'sumativo'],
    required: true,
  },

  // INSTRUMENTO DE EVALUACIÓN
  instrumentType: {
    type: String,
    enum: ['lista_cotejo', 'rsa', 'rubrica'],
    required: true,
  },

  // INDICADORES
  indicators: [{
    description: { type: String },
    points: { type: Number, min: 0, default: 1 }
  }],

  // RSA
  rsaMoments: [
    {
      moment: { type: Number, enum: [1, 2, 3] },
      date: { type: Date, required: true }
    }
  ],

  // RÚBRICA
  rubricCriteria: [
    {
      criterion: { type: String },
      levels: [
        {
          level: { type: String },
          descriptor: { type: String },
          points: { type: Number, min: 0 }
        }
      ]
    }
  ],

  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pendiente', 'publicada', 'cerrada'],
    default: 'publicada',
  },
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
  grade: { type: String, required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },

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

module.exports = mongoose.model('Task', taskSchema);