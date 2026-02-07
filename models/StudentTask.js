const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentTaskSchema = new Schema({
  task: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  status: {
    type: String,
    enum: ['pendiente', 'entregada', 'revisada'],
    default: 'pendiente',
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
  },
  comments: {
    type: String,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('StudentTask', studentTaskSchema);
