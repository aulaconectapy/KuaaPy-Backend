const Task = require("../models/Task");
const User = require("../models/User");
const Student = require("../models/Student");
const StudentTask = require("../models/StudentTask");


// ===============================
// CREAR TAREA + GENERAR StudentTask
// ===============================
exports.createTask = async (req, res) => {
  try {

    const { subject, topic, grade, dueDate, indicators, taskType } = req.body;

    if (req.user.role !== "docente") {
      return res.status(403).json({ message: "Solo docentes pueden crear tareas" });
    }

    const validTypes = ["diagnostico", "formativo", "sumativo"];

    if (!validTypes.includes(taskType)) {
      return res.status(400).json({
        message: "Tipo de tarea inválido",
      });
    }

    const teacher = await User.findById(req.user.userId);

    if (!teacher) {
      return res.status(404).json({ message: "Docente no encontrado" });
    }

    const teacherGrades = teacher.grades || [teacher.grade];

    if (!teacherGrades.includes(grade)) {
      return res.status(403).json({ message: "Grado no asignado al docente" });
    }

    if (!Array.isArray(indicators) || indicators.length === 0) {
      return res.status(400).json({ message: "Debe enviar al menos un indicador" });
    }

    const task = new Task({
      subject,
      topic,
      grade,
      taskType,
      dueDate,
      status: "publicada",
      institution: teacher.institution,
      teacher: teacher._id,
      indicators,
    });

    await task.save();

    const students = await Student.find({
      grade,
      institution: teacher.institution,
    });

    const studentTasks = students.map((student) => ({
      task: task._id,
      student: student._id,
      status: "pendiente",
      indicatorScores: task.indicators.map((i) => ({
        indicatorId: i._id,
        points: 0,
      })),
      score: 0,
    }));

    if (studentTasks.length > 0) {
      await StudentTask.insertMany(studentTasks);
    }

    res.status(201).json({
      message: "Tarea creada exitosamente",
      task,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error al crear tarea",
      error: error.message,
    });

  }
};



// ===============================
// OBTENER TAREAS (DOCENTE)
// ===============================
exports.getTasks = async (req, res) => {
  try {

    let filter = {};

    if (req.user.role === "docente") {
      filter.teacher = req.user.userId;
    }

    const tasks = await Task.find(filter)
      .populate("teacher", "firstName lastName")
      .populate("institution", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error al obtener tareas",
    });

  }
};



// ===============================
// OBTENER TAREA POR ID
// ===============================
exports.getTaskById = async (req, res) => {
  try {

    const task = await Task.findById(req.params.id)
      .populate("teacher", "firstName lastName")
      .populate("institution", "name");

    if (!task) {
      return res.status(404).json({
        message: "Tarea no encontrada",
      });
    }

    res.json(task);

  } catch (error) {

    res.status(500).json({
      message: "Error al obtener tarea",
    });

  }
};



// ===============================
// ACTUALIZAR TAREA
// ===============================
exports.updateTask = async (req, res) => {
  try {

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        message: "Tarea no encontrada",
      });
    }

    res.json(task);

  } catch (error) {

    res.status(500).json({
      message: "Error al actualizar tarea",
    });

  }
};



// ===============================
// ELIMINAR TAREA
// ===============================
exports.deleteTask = async (req, res) => {
  try {

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Tarea no encontrada",
      });
    }

    await StudentTask.deleteMany({
      task: task._id,
    });

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      message: "Tarea eliminada correctamente",
    });

  } catch (error) {

    res.status(500).json({
      message: "Error al eliminar tarea",
    });

  }
};



// ===============================
// OBTENER TAREAS DEL ESTUDIANTE
// ===============================
exports.getMyTasks = async (req, res) => {
  try {

    const student = await Student.findOne({
      user: req.user.userId,
    });

    if (!student) {
      return res.status(404).json({
        message: "Estudiante no encontrado",
      });
    }

    const studentTasks = await StudentTask.find({
      student: student._id,
    })
      .populate({
        path: "task",
        select: "subject topic dueDate grade status taskType",
        match: { status: "publicada" },
      })
      .sort({ createdAt: -1 });

    const filtered = studentTasks.filter((st) => st.task !== null);

    res.json(filtered);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error al obtener tareas del estudiante",
    });

  }
};



// ===============================
// OBTENER STUDENTTASK POR ID
// ===============================
exports.getStudentTaskById = async (req, res) => {
  try {

    const studentTask = await StudentTask.findById(req.params.id)
      .populate("student", "firstName lastName grade")
      .populate("task");

    if (!studentTask) {
      return res.status(404).json({
        message: "Entrega no encontrada",
      });
    }

    res.json(studentTask);

  } catch (error) {

    res.status(500).json({
      message: "Error al obtener entrega",
    });

  }
};



// ===============================
// ACTUALIZAR STUDENTTASK
// ===============================
exports.updateStudentTask = async (req, res) => {
  try {

    const { studentTaskId } = req.params;
    const { status, comments, indicatorScores } = req.body;

    const studentTask = await StudentTask.findById(studentTaskId);

    if (!studentTask) {
      return res.status(404).json({
        message: "StudentTask no encontrado",
      });
    }

    if (status) {
      studentTask.status = status;
    }

    if (comments !== undefined) {
      studentTask.comments = comments;
    }

    if (Array.isArray(indicatorScores)) {

      studentTask.indicatorScores = indicatorScores;

      studentTask.score = indicatorScores.reduce(
        (sum, i) => sum + (i.points || 0),
        0
      );
    }

    studentTask.updatedAt = new Date();

    await studentTask.save();

    res.json({
      message: "Tarea actualizada",
      studentTask,
    });

  } catch (error) {

    res.status(500).json({
      message: "Error al actualizar tarea del alumno",
    });

  }
};



// ===============================
// OBTENER STUDENTTASKS POR GRADO
// ===============================
exports.getStudentTasksByGrade = async (req, res) => {
  try {

    const { grade } = req.params;

    const studentTasks = await StudentTask.find()
      .populate({
        path: "task",
        match: { grade },
      })
      .populate("student", "firstName lastName grade");

    const filtered = studentTasks.filter((st) => st.task !== null);

    res.json(filtered);

  } catch (error) {

    res.status(500).json({
      message: "Error al obtener tareas por grado",
    });

  }
};



// ===============================
// RESUMEN DE ESTUDIANTES POR GRADO
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

      {
        $match: {
          "task.grade": grade,
        },
      },

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

          pendientes: {
            $sum: { $cond: [{ $eq: ["$status", "pendiente"] }, 1, 0] },
          },

          entregadas: {
            $sum: { $cond: [{ $eq: ["$status", "entregada"] }, 1, 0] },
          },

          corregidas: {
            $sum: { $cond: [{ $eq: ["$status", "corregido"] }, 1, 0] },
          },

          totalScore: { $sum: "$score" },
        },
      },

      {
        $addFields: {
          promedio: {
            $cond: [
              { $gt: ["$totalTasks", 0] },
              { $divide: ["$totalScore", "$totalTasks"] },
              0,
            ],
          },
        },
      },

    ]);

    res.json(summary);

  } catch (error) {

    res.status(500).json({
      message: "Error al obtener resumen",
    });

  }
};