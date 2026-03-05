const express = require("express");
const router = express.Router();
const protect = require("../middlewares/protect");

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateStudentTask,
  getStudentTasksByGrade,
  getStudentsSummaryByGrade,
  getStudentTaskById,
  getMyTasks
} = require("../controllers/taskController");

// ===============================
// RUTAS TAREA
// ===============================

// Crear tarea
router.post("/", protect, createTask);

// Obtener todas las tareas
router.get("/", protect, getTasks);

// Obtener tareas del estudiante logueado
router.get("/student-tasks/my", protect, getMyTasks);

// Obtener StudentTasks por grado (docentes)
router.get("/student-tasks/grade/:grade", protect, getStudentTasksByGrade);

// Obtener StudentTask por ID
router.get("/student-task/:id", protect, getStudentTaskById);

// Resumen de estudiantes por grado
router.get("/students-summary/:grade", protect, getStudentsSummaryByGrade);

// Obtener tarea por ID
router.get("/:id", protect, getTaskById);

// Actualizar tarea
router.put("/:id", protect, updateTask);

// Actualizar StudentTask
router.put("/student-task/:studentTaskId", protect, updateStudentTask);

// Eliminar tarea
router.delete("/:id", protect, deleteTask);

module.exports = router;