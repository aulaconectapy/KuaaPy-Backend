const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  subject: {
    type: String, // Nombre de la asignatura
    required: true,
  },
  description: {
    type: String, // Descripción de la tarea
    required: true,
  },
  dueDate: {
    type: Date, // Fecha límite de entrega
  },
  grade: {
    type: String, // Grado al que se asigna la tarea
    required: true,
  },
  assignedStudents: [
    {
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Relación con estudiantes
      status: { type: String, enum: ['Pendiente', 'Entregado'], default: 'Pendiente' },
    },
  ],
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Relación con el docente que crea la tarea
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
