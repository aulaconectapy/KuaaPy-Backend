const Task = require("../models/Task");
const User = require("../models/User");
const Student = require("../models/Student");
const StudentTask = require("../models/StudentTask");

// ===============================
// CREAR TAREA + GENERAR StudentTask
// ===============================
exports.createTask = async (req, res) => {
  try {
    const { subject, topic, grade, dueDate, indicators, status } = req.body;

    if (req.user.role !== "docente")
      return res.status(403).json({ message: "Solo docentes pueden crear tareas" });

    const teacher = await User.findById(req.user.userId);
    if (!teacher) return res.status(404).json({ message: "Docente no encontrado" });

    const teacherGrades = teacher.grades || [teacher.grade];
    if (!teacherGrades.includes(grade))
      return res.status(403).json({ message: "Grado no asignado al docente" });

    if (!Array.isArray(indicators) || indicators.length === 0)
      return res.status(400).json({ message: "Debe enviar al menos un indicador" });

    for (const ind of indicators) {
      if (!ind.description || typeof ind.points !== "number") {
        return res.status(400).json({ message: "Indicadores inválidos" });
      }
    }

    // Crear tarea
    const task = new Task({
      subject,
      topic,
      grade,
      dueDate,
      status: status || "pendiente",
      institution: teacher.institution,
      teacher: teacher._id,
      indicators,
    });

    await task.save();

    // 🔹 Crear StudentTask para cada alumno con los indicadores generados
    const students = await Student.find({ grade, institution: teacher.institution });
    const studentTasks = students.map((student) => ({
      task: task._id,
      student: student._id,
      indicatorScores: task.indicators.map((i) => ({ indicatorId: i._id, points: 0 })),
      score: 0,
    }));

    await StudentTask.insertMany(studentTasks);

    res.status(201).json({ message: "Tarea creada exitosamente", task });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: "Error de validación", errors });
    }

    res.status(500).json({ message: "Error al crear la tarea", error: error.message });
  }
};

// ===============================
// OBTENER TODAS LAS TAREAS (según rol)
// ===============================
exports.getTasks = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "docente") filter.teacher = req.user.userId;

    const tasks = await Task.find(filter)
      .populate("teacher", "firstName lastName")
      .populate("institution", "name");

    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener tareas", error: error.message });
  }
};

// ===============================
// OBTENER TAREAS DE UN ALUMNO (publicadas)
// ===============================
exports.getTasksByGrade = async (req, res) => {
  try {
    const { grade } = req.params;

    const tasks = await Task.find({
      grade,
      institution: req.user.institution,
      status: "publicada",
    });

    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener tareas por grado", error: error.message });
  }
};

// ===============================
// OBTENER UNA TAREA POR ID
// ===============================
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("teacher", "firstName lastName");

    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });
    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener tarea", error: error.message });
  }
};

// ===============================
// ACTUALIZAR TAREA (solo docente)
// ===============================
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

    if (task.teacher.toString() !== req.user.userId)
      return res.status(403).json({ message: "No autorizado" });

    Object.assign(task, req.body);
    await task.save();

    res.status(200).json({ message: "Tarea actualizada", task });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: "Error de validación", errors });
    }

    res.status(500).json({ message: "Error al actualizar tarea", error: error.message });
  }
};

// ===============================
// ELIMINAR TAREA (solo docente)
// ===============================
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

    if (task.teacher.toString() !== req.user.userId)
      return res.status(403).json({ message: "No autorizado" });

    await task.deleteOne();
    await StudentTask.deleteMany({ task: task._id });

    res.status(200).json({ message: "Tarea eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar tarea", error: error.message });
  }
};

// ===============================
// ACTUALIZAR ESTADO DE STUDENTTASK (incluye indicadores y score total)
// ===============================
exports.updateStudentTask = async (req, res) => {
  try {
    const { studentTaskId } = req.params;
    const { status, comments, indicatorScores } = req.body;

    const studentTask = await StudentTask.findById(studentTaskId);
    if (!studentTask) return res.status(404).json({ message: "Registro de tarea no encontrado" });

    if (status) studentTask.status = status;
    if (comments !== undefined) studentTask.comments = comments;

    if (Array.isArray(indicatorScores)) {
      for (const i of indicatorScores) {
        if (!i.indicatorId) {
          return res.status(400).json({ message: "Cada indicador debe tener indicatorId" });
        }
      }

      studentTask.indicatorScores = indicatorScores;
      studentTask.score = indicatorScores.reduce((sum, i) => sum + (i.points || 0), 0);
    }

    studentTask.updatedAt = new Date();
    await studentTask.save();

    res.status(200).json({ message: "Tarea del alumno actualizada", studentTask });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: "Error de validación", errors });
    }

    res.status(500).json({ message: "Error al actualizar StudentTask", error: error.message });
  }
};

// ===============================
// OBTENER TODAS LAS StudentTask DE UN GRADO (para docente)
// ===============================
exports.getStudentTasksByGrade = async (req, res) => {
  try {
    const { grade } = req.params;

    const studentTasks = await StudentTask.find()
      .populate({
        path: "task",
        match: { grade },
        populate: { path: "teacher", select: "firstName lastName" },
      })
      .populate("student", "firstName lastName");

    res.status(200).json(studentTasks.filter((st) => st.task));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener StudentTasks", error: error.message });
  }
};

// ===============================
// RESUMEN POR ESTUDIANTE (promedio, progreso)
// ===============================
exports.getStudentsSummaryByGrade = async (req, res) => {
  try {
    const { grade } = req.params;

    const summary = await StudentTask.aggregate([
      {
        $lookup: {
          from: "tasks",
          localField: "task",
          foreignField: "_id",
          as: "task",
        },
      },
      { $unwind: "$task" },
      { $match: { "task.grade": grade } },
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $group: {
          _id: "$student._id",
          firstName: { $first: "$student.firstName" },
          lastName: { $first: "$student.lastName" },
          totalTasks: { $sum: 1 },
          pendientes: { $sum: { $cond: [{ $eq: ["$status", "pendiente"] }, 1, 0] } },
          entregadas: { $sum: { $cond: [{ $eq: ["$status", "entregada"] }, 1, 0] } },
          revisadas: { $sum: { $cond: [{ $eq: ["$status", "revisada"] }, 1, 0] } },
          totalScore: { $sum: "$score" },
        },
      },
      {
        $addFields: {
          promedio: {
            $cond: [{ $gt: ["$totalTasks", 0] }, { $divide: ["$totalScore", "$totalTasks"] }, 0],
          },
        },
      },
    ]);

    res.status(200).json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener resumen", error: error.message });
  }
};
// ===============================
// OBTENER UN StudentTask POR ID
// ===============================
exports.getStudentTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const studentTask = await StudentTask.findById(id)
      .populate("student", "firstName lastName")
      .populate({
        path: "task",
        select: "subject topic indicators grade",
      });

    if (!studentTask)
      return res.status(404).json({ message: "Entrega no encontrada" });

    res.status(200).json(studentTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener entrega", error: error.message });
  }
};