const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentTaskSchema = new Schema({
  task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['pendiente', 'entregada', 'corregido'], default: 'pendiente' },

  // Nuevo campo: puntajes por indicador
  indicatorScores: [{
    indicatorId: { type: Schema.Types.ObjectId, required: true },
    points: { type: Number, default: 0, min: 0 }
  }],

  score: { type: Number, default: 0, min: 0 }, // suma automática de indicatorScores
  comments: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StudentTask', studentTaskSchema);