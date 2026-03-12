const express = require("express");
const router = express.Router();

const protect = require("../middlewares/protect");

const {
  createReport,
  updateReport,
  deleteReport,
  getReportsByGrade,
  getReportsByStudent,
  getMyReports,
  confirmReport,
  getAllReports
} = require("../controllers/disciplineReportController");


// ===============================
// DOCENTE
// ===============================

router.post("/", protect, createReport);

router.put("/:id", protect, updateReport);

router.delete("/:id", protect, deleteReport);

router.get("/grade/:grade", protect, getReportsByGrade);


// ===============================
// ALUMNOS
// ===============================

router.get("/my-reports", protect, getMyReports);


// ===============================
// VER REPORTES DE UN ALUMNO
// ===============================

router.get("/student/:studentId", protect, getReportsByStudent);


// ===============================
// PADRES CONFIRMAN
// ===============================

router.put("/confirm/:id", protect, confirmReport);


// ===============================
// DIRECTOR
// ===============================

router.get("/", protect, getAllReports);


module.exports = router;