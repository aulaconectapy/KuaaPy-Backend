const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');

const {
  createBehaviorReport,
  getReportsByStudent,
  getReportsByInstitution,
  markReportAsViewed,
  generateReportPDF,
  getStudentStatistics,
} = require('../controllers/behaviorReportController');

router.post('/', protect, createBehaviorReport);
router.get('/student/:studentId', protect, getReportsByStudent);
router.get('/institution', protect, getReportsByInstitution);
router.put('/view/:reportId', protect, markReportAsViewed);
router.get('/pdf/:reportId', protect, generateReportPDF);
router.get('/stats/:studentId', protect, getStudentStatistics);

module.exports = router;