const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

const BehaviorReport = require('../models/BehaviorReport');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const User = require('../models/User');

/* ======================================================
   ➕ CREAR REPORTE
====================================================== */
exports.createBehaviorReport = async (req, res) => {
  try {
    const { studentId, behaviorType, faultType, description } = req.body;
    const user = req.user;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    // DOCENTE
    if (user.role === 'docente') {
      const okInstitution =
        student.institution.toString() === user.institution.toString();
      const okGrade = user.grades.includes(student.grade);

      if (!okInstitution || !okGrade) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }
    }

    // DIRECTOR
    if (user.role === 'director/a') {
      if (student.institution.toString() !== user.institution.toString()) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }
    }

    if (behaviorType === 'Negativo' && !faultType) {
      return res.status(400).json({ message: 'Tipo de falta requerido' });
    }

    const report = await BehaviorReport.create({
      student: student._id,
      institution: student.institution,
      grade: student.grade,
      reportedBy: user._id,
      behaviorType,
      faultType: behaviorType === 'Negativo' ? faultType : null,
      description,
      status: 'Pendiente',
    });

    // 🔔 Notificar a padres
    const parents = await User.find({
      role: 'padre/madre/tutor',
      associatedChildren: student._id,
    });

    for (const parent of parents) {
      await Notification.create({
        user: parent._id,
        title: 'Nuevo reporte de comportamiento',
        message: `Se creó un nuevo reporte para ${student.firstName} ${student.lastName}.`,
        relatedReport: report._id,
      });
    }

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   📄 REPORTES POR ESTUDIANTE
====================================================== */
exports.getReportsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const user = req.user;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    if (user.role === 'docente') {
      if (
        student.institution.toString() !== user.institution.toString() ||
        !user.grades.includes(student.grade)
      ) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }
    }

    if (user.role === 'director/a') {
      if (student.institution.toString() !== user.institution.toString()) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }
    }

    const reports = await BehaviorReport.find({ student: studentId })
      .populate('reportedBy', 'firstName lastName role')
      .sort({ date: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   📚 REPORTES POR INSTITUCIÓN
====================================================== */
exports.getReportsByInstitution = async (req, res) => {
  try {
    const filter = { institution: req.user.institution };

    if (req.user.role === 'docente') {
      filter.grade = { $in: req.user.grades };
    }

    const reports = await BehaviorReport.find(filter)
      .populate('student', 'firstName lastName grade')
      .populate('reportedBy', 'firstName lastName role')
      .sort({ date: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   👨‍👩‍👧 MARCAR COMO VISTO (PADRE)
====================================================== */
exports.markReportAsViewed = async (req, res) => {
  try {
    if (req.user.role !== 'padre/madre/tutor') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const report = await BehaviorReport.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }

    report.status = 'Visto';
    report.viewedAt = new Date();
    await report.save();

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   🧾 PDF AUTOMÁTICO
====================================================== */
exports.generateReportPDF = async (req, res) => {
  const report = await BehaviorReport.findById(req.params.reportId)
    .populate('student')
    .populate('reportedBy');

  if (!report) {
    return res.status(404).json({ message: 'Reporte no encontrado' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=reporte-${report._id}.pdf`
  );

  const doc = new PDFDocument();
  doc.pipe(res);

  doc.fontSize(16).text('REPORTE DE COMPORTAMIENTO', { align: 'center' });
  doc.moveDown();
  doc.text(`Alumno: ${report.student.firstName} ${report.student.lastName}`);
  doc.text(`Grado: ${report.grade}`);
  doc.text(`Tipo: ${report.behaviorType}`);
  if (report.faultType) doc.text(`Falta: ${report.faultType}`);
  doc.text(`Descripción: ${report.description}`);
  doc.text(`Fecha: ${report.date.toLocaleDateString()}`);
  doc.text(
    `Docente: ${report.reportedBy.firstName} ${report.reportedBy.lastName}`
  );

  doc.end();
};

/* ======================================================
   📊 ESTADÍSTICAS POR ALUMNO
====================================================== */
exports.getStudentStatistics = async (req, res) => {
  const stats = await BehaviorReport.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(req.params.studentId) } },
    {
      $group: {
        _id: '$behaviorType',
        total: { $sum: 1 },
      },
    },
  ]);

  res.json(stats);
};