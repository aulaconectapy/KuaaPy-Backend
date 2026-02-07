const Task = require("../models/Task");
const User = require("../models/User");
const Student = require("../models/Student");
const StudentTask = require("../models/StudentTask");

// CREAR TAREA + GENERAR StudentTask
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
      if (!ind.description || typeof ind.points !== "number")
        return res.status(400).json({ message: "Indicadores inválidos" });
    }

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

    // CREAR StudentTask PARA CADA ALUMNO DEL GRADO
    const students = await Student.find({ grade, institution: teacher.institution });
    const studentTasks = students.map(student => ({ task: task._id, student: student._id }));
    await StudentTask.insertMany(studentTasks);

    res.status(201).json({ message: "Tarea creada exitosamente", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear la tarea" });
  }
};

// OBTENER TODAS LAS TAREAS (según rol)
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
    res.status(500).json({ message: "Error al obtener tareas" });
  }
};

// OBTENER TAREAS DE UN ALUMNO (publicadas)
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
    res.status(500).json({ message: "Error al obtener tareas por grado" });
  }
};

// OBTENER UNA TAREA POR ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("teacher", "firstName lastName");

    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });
    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener tarea" });
  }
};

// ACTUALIZAR TAREA (solo docente)
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
    res.status(500).json({ message: "Error al actualizar tarea" });
  }
};

// ELIMINAR TAREA (solo docente)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Tarea no encontrada" });

    if (task.teacher.toString() !== req.user.userId)
      return res.status(403).json({ message: "No autorizado" });

    await task.deleteOne();
    await StudentTask.deleteMany({ task: task._id }); // BORRAR TAMBIÉN LAS TAREAS DE ALUMNOS

    res.status(200).json({ message: "Tarea eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar tarea" });
  }
};

// ACTUALIZAR ESTADO DE STUDENTTASK
exports.updateStudentTask = async (req, res) => {
  try {
    const { studentTaskId } = req.params;
    const { status, score, comments } = req.body;

    const studentTask = await StudentTask.findById(studentTaskId);
    if (!studentTask) return res.status(404).json({ message: "Registro de tarea no encontrado" });

    if (status) studentTask.status = status;
    if (score !== undefined) studentTask.score = score;
    if (comments !== undefined) studentTask.comments = comments;
    studentTask.updatedAt = new Date();

    await studentTask.save();
    res.status(200).json({ message: "Tarea del alumno actualizada", studentTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar StudentTask" });
  }
};

// OBTENER TODAS LAS StudentTask DE UN GRADO (para docente)
exports.getStudentTasksByGrade = async (req, res) => {
  try {
    const { grade } = req.params;

    const studentTasks = await StudentTask.find()
      .populate({
        path: "task",
        match: { grade },
        populate: { path: "teacher", select: "firstName lastName" }
      })
      .populate("student", "firstName lastName");

    res.status(200).json(studentTasks.filter(st => st.task));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener StudentTasks" });
  }
};
