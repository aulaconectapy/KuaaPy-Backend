const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({

  subject: {
    type: String,
    required: true,
  },

  capacities: [{
    type: String,
    required: true,
  }],

  topic: {
    type: String,
    required: true,
  },

  indicators: [{
    description: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
    },
  }],

  dueDate: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
    enum: ['pendiente', 'publicada', 'cerrada'],
    default: 'publicada',
  },

  institution: {
    type: Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },

  grade: {
    type: String,
    required: true,
  },

  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Task', taskSchema);
