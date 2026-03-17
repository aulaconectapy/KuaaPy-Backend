const Task = require("../models/Task");
const User = require("../models/User");
const Student = require("../models/Student");
const StudentTask = require("../models/StudentTask");
// ===============================
// HELPER: Calcular resultado final de RSA
// ===============================
function calculateRSA(m1, m2, m3) {
  // Según tu fórmula de Excel (C13, D13, E13):
  // 1. (L, L, L) -> L
  // 2. (ANL, ANL, ANL) -> ANL
  // 3. (ANL, L, L) -> L
  // 4. (ANL, L, ANL) -> ANL
  // 5. (L, L, ANL) -> ANL
  // 6. (ANL, ANL, L) -> L
  // 7. (L, ANL, ANL) -> ANL
  // 8. (L, ANL, L) -> L

  // CONCLUSIÓN DE LA LÓGICA: El resultado final es IGUAL al Momento 3.
  // Si el estudiante logró el indicador al final (M3), se considera Logrado.
  
  if (m3 === "L") return "L";
  if (m3 === "ANL") return "ANL";
  
  return null; // En caso de que aún no se haya evaluado el M3
}
// ===============================
// CREAR TAREA + GENERAR StudentTask
// ===============================
exports.createTask = async (req, res) => {
  try {
    const {
      subject,
      topic,
      grade,
      dueDate,
      indicators,
      taskType,
      instrumentType,
      rubricCriteria,
      rsaMoments 
    } = req.body;

    const teacher = await User.findById(req.user.userId);

    const task = new Task({
      subject,
      topic,
      grade,
      taskType,
      instrumentType,
      dueDate,
      status: "publicada",
      institution: teacher.institution,
      teacher: teacher._id,
      indicators,
      rubricCriteria,
      rsaMoments
    });

    await task.save();

    const students = await Student.find({
      grade,
      institution: teacher.institution
    });

    const studentTasks = students.map(student => {
      const base = {
        task: task._id,
        student: student._id,
        status: "pendiente",
        score: 0,
        comments: ""
      };

      // Inicializar según instrumento
      if (instrumentType === "lista_cotejo" || instrumentType === "rsa") {
        // En RSA también inicializamos indicatorScores pero vacíos para llenarlos por momento
        base.indicatorScores = []; 
      }

      if (instrumentType === "rsa") {
        base.rsaResults = [
          { moment: 1, result: null },
          { moment: 2, result: null },
          { moment: 3, result: null }
        ];
        base.rsaFinalResult = null;
      }

      if (instrumentType === "rubrica") {
        base.rubricScores = (task.rubricCriteria || []).map(c => ({
          criterion: c.criterion,
          level: null,
          points: 0
        }));
      }

      return base;
    });

    await StudentTask.insertMany(studentTasks);

    res.status(201).json({
      message: "Tarea creada exitosamente",
      task
    });
  } catch (error) {
    console.error("Error createTask:", error);
    res.status(500).json({ message: "Error al crear tarea" });
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
    console.error("Error getTasks:", error);
    res.status(500).json({ message: "Error al obtener tareas" });
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

    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

    res.json(task);
  } catch (error) {
    console.error("Error getTaskById:", error);
    res.status(500).json({ message: "Error al obtener tarea" });
  }
};

// ===============================
// ACTUALIZAR TAREA
// ===============================
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });
    res.json(task);
  } catch (error) {
    console.error("Error updateTask:", error);
    res.status(500).json({ message: "Error al actualizar tarea" });
  }
};

// ===============================
// ELIMINAR TAREA
// ===============================
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

    await StudentTask.deleteMany({ task: task._id });
    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: "Tarea eliminada correctamente" });
  } catch (error) {
    console.error("Error deleteTask:", error);
    res.status(500).json({ message: "Error al eliminar tarea" });
  }
};

// ===============================
// OBTENER TAREAS DEL ESTUDIANTE
// ===============================
exports.getMyTasks = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.userId });
    if (!student) return res.status(404).json({ message: "Estudiante no encontrado" });

    const studentTasks = await StudentTask.find({ student: student._id })
      .populate({
        path: "task",
        select: "subject topic dueDate grade status taskType instrumentType",
        match: { status: "publicada" },
      })
      .sort({ createdAt: -1 });

    const filtered = studentTasks.filter(st => st.task !== null);

    res.json(filtered);
  } catch (error) {
    console.error("Error getMyTasks:", error);
    res.status(500).json({ message: "Error al obtener tareas del estudiante" });
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

    if (!studentTask) return res.status(404).json({ message: "Entrega no encontrada" });

    res.json(studentTask);
  } catch (error) {
    console.error("Error getStudentTaskById:", error);
    res.status(500).json({ message: "Error al obtener entrega" });
  }
};

// ===============================
// ACTUALIZAR STUDENTTASK
// ===============================
exports.updateStudentTask = async (req, res) => {
  try {
    const { studentTaskId } = req.params;
    const { status, comments, indicatorScores, rsaResults, rubricScores } = req.body;

    const studentTask = await StudentTask.findById(studentTaskId)
      .populate("task");

    if (!studentTask) return res.status(404).json({ message: "Entrega no encontrada" });

    const instrument = studentTask.task.instrumentType;

    if (status) studentTask.status = status;
    if (comments !== undefined) studentTask.comments = comments;

    // LISTA DE COTEJO
    if (instrument === "lista_cotejo" && Array.isArray(indicatorScores)) {
      studentTask.indicatorScores = indicatorScores;
      studentTask.score = indicatorScores.reduce((sum, i) => sum + (i.points || 0), 0);
    }

    // RSA
    if (instrument === "rsa" && Array.isArray(rsaResults)) {
      studentTask.rsaResults = rsaResults;
      const m1 = rsaResults.find(r => r.moment === 1)?.result;
      const m2 = rsaResults.find(r => r.moment === 2)?.result;
      const m3 = rsaResults.find(r => r.moment === 3)?.result;
      studentTask.rsaFinalResult = calculateRSA(m1, m2, m3);
    }

    // RUBRICA
    if (instrument === "rubrica" && Array.isArray(rubricScores)) {
      studentTask.rubricScores = rubricScores;
      studentTask.score = rubricScores.reduce((sum, r) => sum + (r.points || 0), 0);
    }

    studentTask.updatedAt = new Date();
    await studentTask.save();

    res.json({ message: "Evaluación actualizada", studentTask });
  } catch (error) {
    console.error("Error updateStudentTask:", error);
    res.status(500).json({ message: "Error al actualizar evaluación" });
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
        match: { grade }
      })
      .populate("student", "firstName lastName grade")
      .populate({
        path: "indicatorScores.indicatorId",
        select: "description points"
      });

    const filtered = studentTasks.filter(st => st.task !== null);
    res.json(filtered);
  } catch (error) {
    console.error("Error getStudentTasksByGrade:", error);
    res.status(500).json({ message: "Error al obtener tareas por grado" });
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
        $lookup: { from: "tasks", localField: "task", foreignField: "_id", as: "task" },
      },
      { $unwind: "$task" },
      { $match: { "task.grade": grade } },
      {
        $lookup: { from: "students", localField: "student", foreignField: "_id", as: "student" }
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
          corregidas: { $sum: { $cond: [{ $eq: ["$status", "corregido"] }, 1, 0] } },
          totalScore: { $sum: "$score" }
        }
      },
      {
        $addFields: {
          promedio: { $cond: [{ $gt: ["$totalTasks", 0] }, { $divide: ["$totalScore", "$totalTasks"] }, 0] }
        }
      }
    ]);

    res.json(summary);
  } catch (error) {
    console.error("Error getStudentsSummaryByGrade:", error);
    res.status(500).json({ message: "Error al obtener resumen" });
  }
};