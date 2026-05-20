const StudentTask = require("../models/StudentTask");
const Task = require("../models/Task");
const Student = require("../models/Student");
const mongoose = require('mongoose'); // Importante para convertir el ID

// Colócalo al principio de tu archivo studentTaskController.js
const calculateRSA = (m1, m2, m3) => {
  // Convertimos 1 a "L" y 0 a "ANL" para procesar
  const v1 = m1 === 1 ? "L" : "ANL";
  const v2 = m2 === 1 ? "L" : "ANL";
  const v3 = m3 === 1 ? "L" : "ANL";

  // Aplicación de tu fórmula de Excel:
  // (L,L,L)->L; (ANL,ANL,ANL)->ANL; (ANL,L,L)->L; (ANL,L,ANL)->ANL; 
  // (L,L,ANL)->ANL; (ANL,ANL,L)->L; (L,ANL,ANL)->ANL; (L,ANL,L)->L
  
  if (v3 === "L") return "L"; 
  return "ANL";
};
// ===============================
// Obtener entrega específica por ID
// ===============================
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
// En controllers/studentTaskController.js
exports.getStudentTasksByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const tasks = await StudentTask.find({ student: studentId })
      .populate({
        path: "task",
        // Aquí traemos explícitamente los campos del modelo Task
        select: "subject topic instrumentType indicators rubricCriteria dueDate" 
      })
      .populate("student", "firstName lastName grade")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error en getStudentTasksByStudentId:", error);
    res.status(500).json({ message: "Error al obtener historial" });
  }
};
// ===============================
// Obtener tareas del estudiante logueado
// ===============================
exports.getMyTasks = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Token inválido o usuario no identificado" });
    }

    const student = await Student.findOne({ user: req.user.userId });
    if (!student) return res.status(404).json({ message: "Estudiante no encontrado" });

    const myTasks = await StudentTask.find({ student: student._id })
      .populate({
        path: "task",
        match: { status: "publicada" }
      })
      .sort({ createdAt: -1 });

    const filtered = myTasks.filter(st => st.task !== null);

    res.json(filtered);
  } catch (error) {
    console.error("Error getMyTasks:", error);
    res.status(500).json({ message: "Error al obtener mis tareas" });
  }
};


// ===============================
// Actualizar / Calificar entrega
// ===============================
exports.updateStudentTask = async (req, res) => {
  try {
    const { studentTaskId } = req.params;

    // DEBUG: Revisa tu consola de Node para ver si estos datos llegan o vienen undefined
    console.log("--- INICIO UPDATE STUDENT TASK ---");
    console.log("ID Recibido:", studentTaskId);
    console.log("Body Recibido:", JSON.stringify(req.body, null, 2));

    const { status, comments, indicatorScores, rsaResults, rubricScores } = req.body;

    const studentTask = await StudentTask.findById(studentTaskId).populate("task");
    if (!studentTask) {
      console.log("Error: Entrega no encontrada en DB");
      return res.status(404).json({ message: "Entrega no encontrada" });
    }

    // Actualización de campos simples
    if (status) studentTask.status = status;
    if (comments !== undefined) studentTask.comments = comments;

    const instrument = studentTask.task.instrumentType;
    console.log("Tipo de instrumento detectado:", instrument);

    // --- LÓGICA RSA ---
    if (instrument === "rsa") {
      // Usamos el array que viene o el que ya tiene la tarea para no borrar datos por error
      const scores = indicatorScores || studentTask.indicatorScores || [];
      studentTask.indicatorScores = scores;
      
      if (scores.length > 0) {
        const indicatorIds = [...new Set(scores.map(is => is.indicatorId.toString()))];
        let totalLogrados = 0;

        indicatorIds.forEach(id => {
          const m1 = scores.find(is => is.indicatorId.toString() === id && is.moment === 1)?.points || 0;
          const m2 = scores.find(is => is.indicatorId.toString() === id && is.moment === 2)?.points || 0;
          const m3 = scores.find(is => is.indicatorId.toString() === id && is.moment === 3)?.points || 0;

          // Usamos Number() para asegurar que la comparación sea numérica
          if (calculateRSA(Number(m1), Number(m2), Number(m3)) === "L") {
            totalLogrados++;
          }
        });

        studentTask.rsaFinalResult = totalLogrados;
        studentTask.score = totalLogrados;
      }
      
      if (rsaResults) studentTask.rsaResults = rsaResults;
      
      studentTask.markModified('indicatorScores');
      studentTask.markModified('rsaResults');
    }

    // --- LÓGICA LISTA DE COTEJO ---
    if (instrument === "lista_cotejo") {
      const scores = indicatorScores || [];
      studentTask.indicatorScores = scores;
      studentTask.score = scores.reduce((sum, i) => sum + (Number(i.points) || 0), 0);
      studentTask.markModified('indicatorScores');
    }

    // --- LÓGICA RÚBRICA ---
    if (instrument === "rubrica") {
      const scores = rubricScores || [];
      console.log("Procesando rúbrica con scores:", scores.length);
      
      studentTask.rubricScores = scores;
      studentTask.score = scores.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
      
      // CRITICO: Forzar a Mongoose a ver el cambio en el array
      studentTask.markModified('rubricScores');
    }

    // Guardar cambios en la base de datos
    const savedTask = await studentTask.save();
    
    console.log("Resultado final guardado - Score:", savedTask.score);
    console.log("--- FIN UPDATE STUDENT TASK ---");

    res.json({ 
      message: "Evaluación actualizada con éxito", 
      studentTask: savedTask 
    });

  } catch (error) {
    console.error("Error CRITICO en updateStudentTask:", error);
    res.status(500).json({ 
      message: "Error al actualizar", 
      error: error.message 
    });
  }
};

// ===============================
// Listado de StudentTask por grado (docente)
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
// Resumen de estudiantes por grado
// ===============================


exports.getStudentsSummaryByGrade = async (req, res) => {
  try {
    const { grade } = req.params;
    const { institutionId } = req.query;

    const matchQuery = {};

    // 1. Filtro de Grado
    if (grade !== 'all') {
      matchQuery["task.grade"] = grade;
    }

    // 2. Filtro de Institución (CORRECCIÓN CLAVE)
    if (institutionId) {
      // Convertimos el string que viene por query en un ObjectId real de MongoDB
      matchQuery["student.institution"] = new mongoose.Types.ObjectId(institutionId);
    }

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
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      
      // Aplicamos el match después de los lookups para tener acceso a student e institution
      { $match: matchQuery },
{
  $group: {
    _id: "$student._id",

    firstName: { $first: "$student.firstName" },
    lastName: { $first: "$student.lastName" },

    // 🔥 AGREGAR ESTO
    grade: { $first: "$task.grade" },

    totalTasks: { $sum: 1 },

    pendientes: {
      $sum: {
        $cond: [{ $eq: ["$status", "pendiente"] }, 1, 0]
      }
    },

    corregidas: {
      $sum: {
        $cond: [{ $eq: ["$status", "corregido"] }, 1, 0]
      }
    },

    listaCotejoLogrado: {
      $sum: {
        $cond: [
          { $eq: ["$task.instrumentType", "lista_cotejo"] },
          "$score",
          0
        ]
      }
    },

    rubricaLogrado: {
      $sum: {
        $cond: [
          { $eq: ["$task.instrumentType", "rubrica"] },
          "$score",
          0
        ]
      }
    },

    rsaLogrado: {
      $sum: {
        $cond: [
          { $eq: ["$task.instrumentType", "rsa"] },
          "$score",
          0
        ]
      }
    },

    puntosGlobalLogrado: { $sum: "$score" }
  }
},
      { $sort: { lastName: 1 } }
    ]);

    res.json(summary);
  } catch (error) {
    console.error("Error en getStudentsSummaryByGrade:", error);
    res.status(500).json({ message: "Error al obtener resumen" });
  }
};

exports.getFullReportByGrade = async (req, res) => {
  try {
    const { grade } = req.params;

    const report = await StudentTask.aggregate([
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
        $lookup: {
          from: "tasks",
          localField: "task",
          foreignField: "_id",
          as: "task"
        }
      },
      { $unwind: "$task" },

      // Filtrar por grado
      {
        $match: {
          "task.grade": grade
        }
      },

      // Agrupar por estudiante + materia
      {
        $group: {
          _id: {
            studentId: "$student._id",
            subject: "$task.subject"
          },
          studentName: {
            $first: {
              $concat: ["$student.firstName", " ", "$student.lastName"]
            }
          },
          tasks: {
            $push: {
              topic: "$task.topic",
              score: "$score"
            }
          },
          totalSubject: { $sum: "$score" }
        }
      },

      // Agrupar por estudiante
      {
        $group: {
          _id: "$_id.studentId",
          studentName: { $first: "$studentName" },
          subjects: {
            $push: {
              subject: "$_id.subject",
              tasks: "$tasks",
              total: "$totalSubject"
            }
          },
          totalGlobal: { $sum: "$totalSubject" }
        }
      },

      { $sort: { studentName: 1 } }
    ]);

    res.json(report);

  } catch (error) {
    console.error("Error en getFullReportByGrade:", error);
    res.status(500).json({ message: "Error al generar reporte" });
  }
};

exports.getGeneralReportByGrade = async (req, res) => {
  try {
    const { grade } = req.params;
    const { institutionId } = req.query;

    const studentMatch = {};

    if (grade !== "all") {
      studentMatch.grade = grade;
    }

    if (institutionId) {
      studentMatch.institution = new mongoose.Types.ObjectId(institutionId);
    }

    // 1. Buscar estudiantes del grado
    const students = await Student.find(studentMatch)
      .select("firstName lastName grade")
      .sort({ lastName: 1, firstName: 1 });

    // 2. Buscar tareas del grado
    const taskMatch = {};

    if (grade !== "all") {
      taskMatch.grade = grade;
    }

    const tasks = await Task.find(taskMatch)
      .select("subject topic instrumentType indicators rubricCriteria")
      .sort({ subject: 1, createdAt: 1 });

    // 3. Preparar columnas de la planilla
const columns = tasks.map(task => {
  let maxPoints = 0;

  if (task.instrumentType === "lista_cotejo" || task.instrumentType === "rsa") {
    maxPoints = task.indicators?.reduce((sum, i) => {
      return sum + (Number(i.points) || 0);
    }, 0) || 0;
  }

  if (task.instrumentType === "rubrica") {
    maxPoints = task.rubricCriteria?.reduce((sum, criterion) => {
      const maxCriterionPoints = criterion.levels?.reduce((max, level) => {
        return Math.max(max, Number(level.points) || 0);
      }, 0) || 0;

      return sum + maxCriterionPoints;
    }, 0) || 0;
  }

  return {
    taskId: task._id,
    subject: task.subject,
    topic: task.topic,
    instrumentType: task.instrumentType,
    maxPoints
  };
});

    // 4. Buscar calificaciones
    const studentIds = students.map(s => s._id);
    const taskIds = tasks.map(t => t._id);

    const studentTasks = await StudentTask.find({
      student: { $in: studentIds },
      task: { $in: taskIds }
    }).select("student task score status");

    // 5. Armar filas
    const rows = students.map(student => {
      const scores = {};
      let total = 0;

      tasks.forEach(task => {
        const found = studentTasks.find(st =>
          st.student.toString() === student._id.toString() &&
          st.task.toString() === task._id.toString()
        );

        const score = found ? found.score : 0;

        scores[task._id] = {
          score,
          status: found ? found.status : "sin_registro"
        };

        total += score;
      });

      return {
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        grade: student.grade,
        scores,
        total
      };
    });

    res.json({
      columns,
      rows
    });

  } catch (error) {
    console.error("Error en getGeneralReportByGrade:", error);
    res.status(500).json({
      message: "Error al generar reporte general",
      error: error.message
    });
  }
};