const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');
const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  loginStudent, // Importamos la función de login
} = require('../controllers/studentController');

// Ruta para crear un estudiante
router.post('/', protect, createStudent);

// Ruta para obtener todos los estudiantes
router.get('/', protect, getAllStudents);

// Ruta para obtener un estudiante por su ID
router.get('/:id', protect, getStudentById);

// Ruta para actualizar un estudiante por su ID
router.put('/:id', protect, updateStudent);

// Ruta para eliminar un estudiante por su ID
router.delete('/:id', protect, deleteStudent);

// Ruta para iniciar sesión con cédula y contraseña
router.post('/login', loginStudent); // Ruta para login

module.exports = router;
