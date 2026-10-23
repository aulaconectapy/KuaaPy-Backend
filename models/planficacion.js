const mongoose = require('mongoose');

// 1. Esquema de Indicadores (Para evaluar cada materia)
const IndicadorSchema = new mongoose.Schema({
  descripcion: {
    type: String,
    required: false,
    trim: true
  },
  puntos: {
    type: Number,
    default: 1,
    min: 0
  }
});

// 2. Esquema de cada Bloque/Materia
const BloqueMateriaSchema = new mongoose.Schema({
  asignatura: { 
    type: String, 
    required: false,
    trim: true 
  },
  unidadTematica: { 
    type: String,
    trim: true 
  },
  tema: { 
    type: String, 
    required: false,
    trim: true 
  },
  // 🔹 NUEVO CAMPO: Capacidad separada del tema
  capacidad: {
    type: String,
    trim: true
  },
  // 🔹 NUEVO CAMPO: Momentos didácticos (Opcional por materia)
  momentosDidacticos: {
    type: String,
    trim: true
  },
  guiaDocente: { 
    type: String,
    trim: true 
  },
  cuadernilloEstudiante: { 
    type: String, 
    trim: true 
  },
  instrumentoEvaluacion: { 
    type: String, 
    default: 'Lista de cotejo',
    trim: true 
  },
  // 🔹 NUEVO CAMPO: Indicadores de evaluación
  indicadores: [IndicadorSchema],

  recursosAdicionales: {
    type: String,
    trim: true
  },
  orden: { 
    type: Number,
    default: 0 
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


// 3. Esquema de Día
const DiaPlanificacionSchema = new mongoose.Schema({
  fecha: { 
    type: Date 
  },
  nombreDia: { 
    type: String, 
    enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    required: true 
  },
  materias: [BloqueMateriaSchema],

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


// 4. Esquema Principal
const PlanificacionSemanalSchema = new mongoose.Schema({
  profesor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  institucion: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Institution',
    required: true
  },
  grado: { 
    type: String, 
    required: true 
  },
  seccion: { 
    type: String 
  },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },

  dias: [DiaPlanificacionSchema],

  observacionesGenerales: { 
    type: String 
  },
  estado: { 
    type: String, 
    enum: ['Borrador', 'Enviado', 'Aprobado', 'Rechazado'], 
    default: 'Borrador' 
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

}, { 
  timestamps: true 
});


// Índices
PlanificacionSemanalSchema.index({ profesor: 1, fechaInicio: -1 });

module.exports = mongoose.model('Planificacion', PlanificacionSemanalSchema);