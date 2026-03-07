const express = require('express');
const router = express.Router();

const protect = require('../middlewares/protect');

const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getMyTasks,
  updateMyProfile
} = require('../controllers/studentController');

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

// ================================
// ESTUDIANTE LOGUEADO
// ================================

// Obtener MIS tareas
router.get('/my-tasks', protect, getMyTasks);

// 🔹 ACTUALIZAR PERFIL DEL ESTUDIANTE (PADRES/ALUMNO)
router.put('/my-profile', protect, updateMyProfile);

module.exports = router;