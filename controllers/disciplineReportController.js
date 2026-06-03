const mongoose = require("mongoose");
const DisciplineReport = require("../models/DisciplineReport");
const Student = require("../models/Student");
const Notification = require("../models/Notification");
const User = require("../models/User");

exports.createReport = async (req, res) => {
  try {

    const {
      student,
      grade,
      severity,
      faultType,
      description,
      actionTaken,
      observation
    } = req.body;

    const studentData = await Student.findById(student);

    if (!studentData) {
      return res.status(404).json({ message: "Estudiante no encontrado" });
    }

    const studentUserId = studentData.user;

    const report = await DisciplineReport.create({
      student: studentData._id,
      studentUser: studentUserId,
      teacher: req.user.userId,
      institution: req.user.institution,
      grade: grade || studentData.grade,
      severity,
      faultType,
      description,
      actionTaken,
      observation
    });

    // SOCKET
    const io = req.app.get("io");
    const connectedUsers = req.app.get("connectedUsers");

    // NOTIFICAR AL ESTUDIANTE
    const studentSocket = connectedUsers[studentUserId];

    if (studentSocket) {
      io.to(studentSocket).emit("new-report", {
        message: "Tienes un nuevo reporte disciplinario",
        report
      });
    }

    // CONTAR REPORTES DEL ESTUDIANTE
    const reportCount = await DisciplineReport.countDocuments({
      student: studentData._id
    });

    // BUSCAR DIRECTORES
    const User = require("../models/User");

    const directors = await User.find({
      role: "director/a",
      institution: req.user.institution
    });

// ALERTA PARA DIRECTORES
if (severity === "Grave" || reportCount >= 5) {

  for (const director of directors) {

    // guardar notificación en DB
    const notification = await Notification.create({

      user: director._id,

      message:
        severity === "Grave"
          ? `⚠️ Reporte GRAVE para ${studentData.firstName} ${studentData.lastName}`
          : `⚠️ ${studentData.firstName} tiene ${reportCount} reportes disciplinarios`,

      type: "discipline-alert",

      report: report._id

    });

    const directorSocket = connectedUsers[director._id];

    if (directorSocket) {

      io.to(directorSocket).emit("director-notification", notification);

    }

  }

}
    res.status(201).json(report);

  } catch (error) {
    console.log("ERROR CREANDO REPORTE:", error);
    res.status(500).json({ message: error.message });
  }
};
// ===============================
// EDITAR REPORTE
// ===============================
exports.updateReport = async (req, res) => {
  try {
    console.log("===== EDITAR REPORTE =====");
    console.log("ID:", req.params.id);
    console.log("Datos:", req.body);

    const report = await DisciplineReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    Object.assign(report, req.body);
    report.edited = true;
    report.editedAt = new Date();

    await report.save();
    console.log("✅ Reporte actualizado");
    res.json(report);
  } catch (error) {
    console.log("❌ ERROR ACTUALIZANDO REPORTE:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ELIMINAR REPORTE
// ===============================
exports.deleteReport = async (req, res) => {
  try {
    console.log("===== ELIMINAR REPORTE =====");
    console.log("ID:", req.params.id);

    const report = await DisciplineReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    await report.deleteOne();
    console.log("✅ Reporte eliminado");
    res.json({ message: "Reporte eliminado correctamente" });
  } catch (error) {
    console.log("❌ ERROR ELIMINANDO REPORTE:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// VER REPORTES POR GRADO (DOCENTE)
// ===============================
exports.getReportsByGrade = async (req, res) => {
  try {

    const teacher = await User.findById(req.user.userId);

    const reports = await DisciplineReport.find({
      grade: { $in: teacher.grades },
      institution: req.user.institution
    })
      .populate("student", "firstName lastName")
      .populate("teacher", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(reports);

  } catch (error) {
    console.log("❌ ERROR OBTENIENDO REPORTES:", error);
    res.status(500).json({ message: error.message });
  }
};
// ===============================
// VER REPORTES DE UN ALUMNO
// ===============================
exports.getReportsByStudent = async (req, res) => {
  try {
    console.log("===== REPORTES DE ESTUDIANTE =====");
    console.log("Student ID:", req.params.studentId);

    const reports = await DisciplineReport.find({
      student: req.params.studentId
    })
      .populate("teacher", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.log("❌ ERROR OBTENIENDO REPORTES:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// VER MIS REPORTES (ALUMNO)
// ===============================
exports.getMyReports = async (req, res) => {
  try {
    console.log("===== MIS REPORTES =====");
    console.log("Usuario:", req.user.userId);

    const reports = await DisciplineReport.find({
      studentUser: req.user.userId
    })
      .populate("teacher", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.log("❌ ERROR OBTENIENDO MIS REPORTES:", error);
    res.status(500).json({ message: error.message });
  }
};
// ===============================
// PADRES CONFIRMAN REPORTE
// ===============================
exports.confirmReport = async (req, res) => {
  try {
    console.log("===== CONFIRMAR REPORTE =====");

    const { parentName, parentRelation } = req.body;

    const report = await DisciplineReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    report.parentReviewed = true;
    report.parentReviewedAt = new Date();
    report.parentName = parentName;
    report.parentRelation = parentRelation;
    report.parentUser = req.user._id;
    report.status = "Visto por padres";

    await report.save();
    console.log("✅ Reporte confirmado por padres");
    res.json({ message: "Reporte confirmado correctamente" });
  } catch (error) {
    console.log("❌ ERROR CONFIRMANDO REPORTE:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// DIRECTOR VE TODOS LOS REPORTES
// ===============================
exports.getAllReports = async (req, res) => {
  try {
    console.log("===== TODOS LOS REPORTES =====");

    const reports = await DisciplineReport.find({
      institution: req.user.institution
    })
      .populate("student", "firstName lastName grade")
      .populate("teacher", "firstName lastName")
      .sort({ createdAt: -1 });

    console.log("Cantidad total:", reports.length);
    res.json(reports);
  } catch (error) {
    console.log("❌ ERROR OBTENIENDO TODOS LOS REPORTES:", error);
    res.status(500).json({ message: error.message });
  }
};