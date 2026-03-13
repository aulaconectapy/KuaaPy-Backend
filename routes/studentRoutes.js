const express = require('express');
const router = express.Router();

const protect = require('../middlewares/protect');
const Student = require('../models/Student'); // <-- importa tu modelo Student

const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getMyTasks,
  updateMyProfile,
  getMyProfile,
  toggleStudentStatus
} = require('../controllers/studentController');


// ================================
// ESTUDIANTE LOGUEADO
// ================================
router.put('/:id/toggle-status', protect, toggleStudentStatus);

// Obtener perfil del estudiante logueado
router.get('/my-profile', protect, getMyProfile);
router.put('/my-profile', protect, updateMyProfile);
// Obtener MIS tareas
router.get('/my-tasks', protect, getMyTasks);

router.put('/:id/toggle-status', protect, toggleStudentStatus);

// Actualizar perfil del estudiante
router.put('/my-profile', protect, updateMyProfile);

// ================================
// CRUD ADMINISTRADOR / DOCENTE
// ================================

// Crear estudiante
router.post('/', protect, createStudent);

// Obtener todos
router.get('/', protect, getAllStudents);

// Obtener por ID
router.get('/:id', protect, getStudentById);

// Actualizar
router.put('/:id', protect, updateStudent);

// Eliminar
router.delete('/:id', protect, deleteStudent);

module.exports = router;