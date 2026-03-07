const express = require("express");
const router = express.Router();
const protect = require("../middlewares/protect");
const {
  getStudentTaskById,
  updateStudentTask,
  getStudentTasksByGrade,
  getMyTasks,
  getStudentsSummaryByGrade
} = require("../controllers/studentTaskController");

// Ordenamos de lo más específico a lo más general
router.get("/my-tasks", protect, getMyTasks);

router.get("/summary/:grade", protect, getStudentsSummaryByGrade);
router.get("/grade/:grade", protect, getStudentTasksByGrade);
router.get("/:id", protect, getStudentTaskById);
router.put("/:studentTaskId", protect, updateStudentTask);


module.exports = router;