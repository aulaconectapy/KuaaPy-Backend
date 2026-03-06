const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('../models/Student');
const connectDB = require('../config/db');

// Conectamos a la base de datos
connectDB();

const students = JSON.parse(fs.readFileSync('seed/students3grado.json', 'utf-8'));

async function seed() {
  try {
    await Student.insertMany(students);
    console.log('Estudiantes creados con éxito');
  } catch (err) {
    console.error('Error al crear estudiantes:', err);
  } finally {
    mongoose.disconnect();
  }
}

seed();