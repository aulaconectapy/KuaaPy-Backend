const mongoose = require('mongoose');

// 1. Definimos el esquema de cada Clase/Materia (Bloque)
const BloqueMateriaSchema = new mongoose.Schema({
  asignatura: { 
    type: String, 
    required: true,
    trim: true 
  },
  unidadTematica: { 
    type: String,
    trim: true 
  },
  tema: { 
    type: String, 
    required: true,
    trim: true 
  },
  guiaDocente: { 
    type: String, // Permite rangos como "12-16"
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
  recursosAdicionales: {
    type: String, // Ej: "Libro Ñepytyvö Rekávo"
    trim: true
  },
  orden: { 
    type: Number, // Para saber si es la 1ª, 2ª o 3ª materia del día
    default: 0 
  }
});

// 2. Esquema para cada Día de la semana
const DiaPlanificacionSchema = new mongoose.Schema({
  fecha: { 
    type: Date, 
    required: true 
  },
  nombreDia: { 
    type: String, 
    enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    required: true 
  },
  // AQUÍ ESTÁ EL CAMBIO CLAVE: Un array de materias
  materias: [BloqueMateriaSchema] 
});

// 3. Esquema Principal de la Planificación Semanal
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
  // Rango de la semana
  fechaInicio: { type: Date, required: true }, // Lunes
  fechaFin: { type: Date, required: true },    // Viernes
  
  // Contenedor de los días (que a su vez contienen sus materias)
  dias: [DiaPlanificacionSchema],

  observacionesGenerales: { 
    type: String 
  },
  estado: { 
    type: String, 
    enum: ['Borrador', 'Enviado', 'Aprobado', 'Rechazado'], 
    default: 'Borrador' 
  }
}, { 
  timestamps: true // Crea automágicamente createdAt y updatedAt
});

// Índices para búsquedas rápidas
PlanificacionSemanalSchema.index({ profesor: 1, fechaInicio: -1 });

module.exports = mongoose.model('Planificacion', PlanificacionSemanalSchema);