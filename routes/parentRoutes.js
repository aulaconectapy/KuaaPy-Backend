const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect');

const {
  getMyChildren,
  getChildReports,
  getPendingReports,
} = require('../controllers/parentController');

router.get('/children', protect, getMyChildren);
router.get('/reports/:studentId', protect, getChildReports);
router.get('/reports-pending', protect, getPendingReports);

module.exports = router;