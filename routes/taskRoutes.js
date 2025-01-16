const express = require('express');
const { createTask, getTasksByGrade, updateTaskStatus, getStudentProgress, associateParent } = require('../controllers/taskController');
const protect = require('../middlewares/protect'); // Middleware de protección
const router = express.Router();

// Ruta para que los docentes creen una tarea
router.post('/create', protect, createTask);

// Obtener tareas por grado (estudiantes y docentes)
router.get('/grade/:grade', protect, getTasksByGrade);

// Actualizar el estado de una tarea (docentes)
router.put('/status/:taskId', protect, updateTaskStatus);

// Ver el progreso del estudiante (padres y estudiantes)
router.get('/progress/:studentId', protect, getStudentProgress);

// Asociar a un padre/madre con un hijo
router.post('/associate', protect, associateParent);

module.exports = router;
