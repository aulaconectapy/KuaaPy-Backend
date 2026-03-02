const BehaviorReport = require('../models/BehaviorReport');
const Student = require('../models/Student');

// 👨‍👩‍👧 Hijos del padre
exports.getMyChildren = async (req, res) => {
  if (req.user.role !== 'padre/madre/tutor') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const students = await Student.find({
    _id: { $in: req.user.associatedChildren },
  });

  res.json(students);
};

// 📄 Reportes de un hijo
exports.getChildReports = async (req, res) => {
  if (req.user.role !== 'padre/madre/tutor') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const { studentId } = req.params;

  if (!req.user.associatedChildren.includes(studentId)) {
    return res.status(403).json({ message: 'No autorizado' });
  }

  const reports = await BehaviorReport.find({ student: studentId })
    .sort({ date: -1 });

  res.json(reports);
};

// 🔴 Reportes pendientes
exports.getPendingReports = async (req, res) => {
  if (req.user.role !== 'padre/madre/tutor') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const reports = await BehaviorReport.find({
    student: { $in: req.user.associatedChildren },
    status: 'Pendiente',
  });

  res.json(reports);
};