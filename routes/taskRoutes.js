const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');

const {
  createTask,
  getTasks,
  getTasksByGrade,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

// Crear tarea (docente)
router.post('/', protect, createTask);

// Obtener todas las tareas (según rol)
router.get('/', protect, getTasks);

// Obtener tareas por grado (estudiantes)
router.get('/grade/:grade', protect, getTasksByGrade);

// Obtener tarea por ID
router.get('/:id', protect, getTaskById);

// Actualizar tarea
router.put('/:id', protect, updateTask);

// Eliminar tarea
router.delete('/:id', protect, deleteTask);

module.exports = router;
