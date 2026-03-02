const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');

const {
  getInstitutionSummary,
  getCriticalCases,
} = require('../controllers/directorDashboardController');

router.get('/summary', protect, getInstitutionSummary);
router.get('/critical', protect, getCriticalCases);

module.exports = router;