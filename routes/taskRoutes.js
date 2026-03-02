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
  updateStudentTask,
  getStudentTasksByGrade,
  getStudentsSummaryByGrade
} = require('../controllers/taskController');

// RUTAS TAREA
router.post('/', protect, createTask);
router.get('/', protect, getTasks);
router.get('/grade/:grade', protect, getTasksByGrade); // Para alumnos
router.get('/student-tasks/grade/:grade', protect, getStudentTasksByGrade); // Para docentes
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, updateTask);
router.put('/student-task/:studentTaskId', protect, updateStudentTask); // Cambiar estado por alumno
router.delete('/:id', protect, deleteTask);
router.get('/students-summary/:grade', protect, getStudentsSummaryByGrade);

module.exports = router;
