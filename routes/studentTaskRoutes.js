const express = require("express");
const router = express.Router();
const protect = require("../middlewares/protect");
const {
  getStudentTaskById,
  updateStudentTask,
  getStudentTasksByGrade,
  getMyTasks,
  getStudentsSummaryByGrade, 
  getStudentTasksByStudentId,
  getFullReportByGrade,
    getGeneralReportByGrade

} = require("../controllers/studentTaskController");

// Ordenamos de lo más específico a lo más general
router.get("/my-tasks", protect, getMyTasks);

router.get("/summary/:grade", protect, getStudentsSummaryByGrade);
router.get("/grade/:grade", protect, getStudentTasksByGrade);
router.get("/report/general/:grade", protect, getGeneralReportByGrade);
router.get("/report/full/:grade", protect, getFullReportByGrade);
router.get("/:id", protect, getStudentTaskById);
router.put("/:studentTaskId", protect, updateStudentTask);
// NUEVA RUTA: Obtener historial de tareas de un estudiante específico (para el docente)
router.get('/:studentId/tasks', protect, getStudentTasksByStudentId);

module.exports = router;