const BehaviorReport = require('../models/BehaviorReport');

// 📊 Resumen general
exports.getInstitutionSummary = async (req, res) => {
  if (req.user.role !== 'director/a') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const institution = req.user.institution;

  const totalReports = await BehaviorReport.countDocuments({ institution });
  const pendingReports = await BehaviorReport.countDocuments({
    institution,
    status: 'Pendiente',
  });

  const byType = await BehaviorReport.aggregate([
    { $match: { institution } },
    { $group: { _id: '$behaviorType', total: { $sum: 1 } } },
  ]);

  const byFault = await BehaviorReport.aggregate([
    { $match: { institution, behaviorType: 'Negativo' } },
    { $group: { _id: '$faultType', total: { $sum: 1 } } },
  ]);

  res.json({
    totalReports,
    pendingReports,
    byType,
    byFault,
  });
};

// 🚨 Casos críticos (muy graves)
exports.getCriticalCases = async (req, res) => {
  const reports = await BehaviorReport.find({
    institution: req.user.institution,
    faultType: 'Muy grave',
  })
    .populate('student', 'firstName lastName grade')
    .sort({ date: -1 });

  res.json(reports);
};