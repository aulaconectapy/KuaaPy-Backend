const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studentTaskSchema = new Schema({
  task: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    required: true
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  status: {
    type: String,
    enum: ["pendiente", "entregada", "corregido"],
    default: "pendiente",
  },

  // LISTA DE COTEJO Y RSA
  indicatorScores: [
    {
      indicatorId: { type: Schema.Types.ObjectId },
      points: { type: Number, default: 0, min: 0 },
      moment: { type: Number, enum: [1, 2, 3], default: 1 },
      evaluatedAt: { type: Date, default: Date.now }
    }
  ],

  // RSA: Resumen cualitativo por momento (Mantenemos strings aquí para la vista rápida)
  rsaResults: [
    {
      moment: { type: Number, enum: [1, 2, 3] },
      result: { type: String, enum: ["L", "ANL"] }
    }
  ],

  // MODIFICADO: Ahora es un NÚMERO (Conteo de indicadores logrados)
  // Eliminamos el 'enum' porque ahora puede ser 0, 1, 2, 3, 4, 5...
  rsaFinalResult: {
    type: Number,
    default: 0
  },

  // RÚBRICA
  rubricScores: [
    {
      criterion: { type: String },
      level: { type: String },
      points: { type: Number, min: 0 }
    }
  ],

  score: {
    type: Number,
    default: 0,
    min: 0
  },
  comments: {
    type: String,
    default: ""
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

module.exports = mongoose.model("StudentTask", studentTaskSchema);