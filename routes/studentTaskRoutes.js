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
  getGeneralReportByGrade,
  getStudentProcessReport,
} = require("../controllers/studentTaskController");

// RUTAS ESPECÍFICAS PRIMERO
router.get("/my-tasks", protect, getMyTasks);

router.get("/report/student-process",protect, getStudentProcessReport);
router.get("/report/general/:grade", protect, getGeneralReportByGrade);
router.get("/report/full/:grade", protect, getFullReportByGrade);

router.get("/summary/:grade", protect, getStudentsSummaryByGrade);
router.get("/grade/:grade", protect, getStudentTasksByGrade);

// RUTAS DINÁMICAS AL FINAL
router.get("/:studentId/tasks", protect, getStudentTasksByStudentId);
router.get("/:id", protect, getStudentTaskById);

router.put("/:studentTaskId", protect, updateStudentTask);

module.exports = router;