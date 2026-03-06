const express = require("express");
const router = express.Router();

const protect = require("../middlewares/protect");

const {

  createDailyReport,
  createDisciplineReport,
  getReportsByGrade,
  getMyReports

} = require("../controllers/reportController");


// ======================
// DOCENTE
// ======================

router.post("/daily", protect, createDailyReport);

router.post("/discipline", protect, createDisciplineReport);

router.get("/grade", protect, getReportsByGrade);


// ======================
// ESTUDIANTE
// ======================

router.get("/my-reports", protect, getMyReports);


module.exports = router;