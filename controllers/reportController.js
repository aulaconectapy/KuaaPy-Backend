const DailyReport = require("../models/DailyReport");
const DisciplineReport = require("../models/DisciplineReport");
const Student = require("../models/Student");


// ============================
// CREAR REPORTE DIARIO
// ============================

exports.createDailyReport = async (req, res) => {

  try {

    const { studentId, tasksCompleted, participation, behavior, observation } = req.body;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Estudiante no encontrado" });
    }

    const report = new DailyReport({
      student: student._id,
      institution: student.institution,
      grade: student.grade,
      teacher: req.user.userId,
      tasksCompleted,
      participation,
      behavior,
      observation
    });

    await report.save();

    res.status(201).json({
      message: "Reporte diario creado",
      report
    });

  } catch (error) {

    res.status(500).json({
      message: "Error al crear reporte diario",
      error: error.message
    });

  }

};



// ============================
// CREAR REPORTE DISCIPLINARIO
// ============================

exports.createDisciplineReport = async (req, res) => {

  try {

    const { studentId, faultType, description, actionTaken } = req.body;

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Estudiante no encontrado" });
    }

    const report = new DisciplineReport({
      student: student._id,
      institution: student.institution,
      grade: student.grade,
      teacher: req.user.userId,
      faultType,
      description,
      actionTaken
    });

    await report.save();

    res.status(201).json({
      message: "Reporte disciplinario creado",
      report
    });

  } catch (error) {

    res.status(500).json({
      message: "Error al crear reporte disciplinario",
      error: error.message
    });

  }

};



// ============================
// DOCENTE VER REPORTES DE SU GRADO
// ============================

exports.getReportsByGrade = async (req, res) => {

  try {

    const teacher = req.user;

    const reports = await DailyReport.find({
      grade: { $in: teacher.grades }
    }).populate("student", "firstName lastName");

    res.json(reports);

  } catch (error) {

    res.status(500).json({
      message: "Error al obtener reportes"
    });

  }

};



// ============================
// ESTUDIANTE VER SUS REPORTES
// ============================

exports.getMyReports = async (req, res) => {

  try {

    const student = await Student.findOne({
      user: req.user.userId
    });

    if (!student) {
      return res.status(404).json({
        message: "Estudiante no encontrado"
      });
    }

    const dailyReports = await DailyReport.find({
      student: student._id
    }).sort({ date: -1 });

    const disciplineReports = await DisciplineReport.find({
      student: student._id
    }).sort({ date: -1 });

    res.json({
      dailyReports,
      disciplineReports
    });

  } catch (error) {

    res.status(500).json({
      message: "Error al obtener reportes"
    });

  }

};