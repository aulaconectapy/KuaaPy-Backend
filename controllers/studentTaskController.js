const StudentTask = require("../models/StudentTask");
const Student = require("../models/Student");

// Obtener entrega específica por ID
exports.getStudentTaskById = async (req, res) => {
  try {
    const studentTask = await StudentTask.findById(req.params.id)
      .populate("student", "firstName lastName grade")
      .populate("task");

    if (!studentTask) {
      return res.status(404).json({ message: "Entrega no encontrada" });
    }

    res.json(studentTask);
  } catch (error) {
    console.error("Error getStudentTaskById:", error);
    res.status(500).json({ message: "Error al obtener entrega" });
  }
};


// Obtener tareas del estudiante logueado
exports.getMyTasks = async (req, res) => {
  try {

    console.log("🔐 USER desde token:", req.user);

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Token inválido o usuario no identificado" });
    }

    // Buscar estudiante asociado al usuario
    const student = await Student.findOne({ user: req.user.userId });

    console.log("🎓 STUDENT encontrado:", student);

    if (!student) {
      return res.status(404).json({ message: "Estudiante no encontrado" });
    }

    // Buscar tareas del estudiante
    const myTasks = await StudentTask.find({ student: student._id })
      .populate({
        path: "task",
        match: { status: "publicada" }
      })
      .sort({ createdAt: -1 });

    const filtered = myTasks.filter((st) => st.task !== null);

    console.log("📚 Tareas encontradas:", filtered.length);

    res.json(filtered);

  } catch (error) {
    console.error("❌ Error getMyTasks:", error);
    res.status(500).json({ message: "Error al obtener mis tareas" });
  }
};


// Calificar / Actualizar entrega
exports.updateStudentTask = async (req, res) => {
  try {
    const { studentTaskId } = req.params;
    const { status, comments, indicatorScores } = req.body;

    const studentTask = await StudentTask.findById(studentTaskId);

    if (!studentTask) {
      return res.status(404).json({ message: "Entrega no encontrada" });
    }

    if (status) studentTask.status = status;
    if (comments !== undefined) studentTask.comments = comments;

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
      studentTask
    });

  } catch (error) {
    console.error("Error updateStudentTask:", error);
    res.status(500).json({ message: "Error al actualizar tarea" });
  }
};


// Listado para docente por grado
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
        path: "indicatorScores.indicatorId", // <--- populamos indicador
        select: "name"                        // solo traemos el nombre
      });

    const filtered = studentTasks.filter((st) => st.task !== null);

    res.json(filtered);

  } catch (error) {
    console.error("Error getStudentTasksByGrade:", error);
    res.status(500).json({ message: "Error al obtener tareas por grado" });
  }
};


// Resumen estadístico por grado
exports.getStudentsSummaryByGrade = async (req, res) => {
  try {

    const { grade } = req.params;

    const summary = await StudentTask.aggregate([
      {
        $lookup: {
          from: "tasks",
          localField: "task",
          foreignField: "_id",
          as: "task"
        }
      },
      { $unwind: "$task" },

      {
        $match: {
          "task.grade": grade
        }
      },

      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "student"
        }
      },

      { $unwind: "$student" },

      {
        $group: {
          _id: "$student._id",
          firstName: { $first: "$student.firstName" },
          lastName: { $first: "$student.lastName" },

          totalTasks: { $sum: 1 },

          pendientes: {
            $sum: {
              $cond: [{ $eq: ["$status", "pendiente"] }, 1, 0]
            }
          },

          entregadas: {
            $sum: {
              $cond: [{ $eq: ["$status", "entregada"] }, 1, 0]
            }
          },

          corregidas: {
            $sum: {
              $cond: [{ $eq: ["$status", "corregido"] }, 1, 0]
            }
          },

          totalScore: { $sum: "$score" }
        }
      },

      {
        $addFields: {
          promedio: {
            $cond: [
              { $gt: ["$totalTasks", 0] },
              { $divide: ["$totalScore", "$totalTasks"] },
              0
            ]
          }
        }
      }
    ]);

    res.json(summary);

  } catch (error) {
    console.error("Error getStudentsSummaryByGrade:", error);
    res.status(500).json({ message: "Error al obtener resumen" });
  }
};