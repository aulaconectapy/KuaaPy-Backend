const Task = require('../models/Task');
const User = require('../models/User');

// Crear una tarea (solo docentes)
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      subject,
      capacities,
      topic,
      indicators,
      dueDate,
      grade,
      status,
    } = req.body;

    // 1️⃣ Verificar rol
    if (req.user.role !== 'docente') {
      return res.status(403).json({ message: 'Solo los docentes pueden crear tareas.' });
    }

    // 2️⃣ Obtener docente completo
    const teacher = await User.findById(req.user.userId);
    if (!teacher) {
      return res.status(404).json({ message: 'Docente no encontrado.' });
    }

    // 3️⃣ Validar grado asignado al docente
    const teacherGrades = teacher.grades || [teacher.grade];
    if (!teacherGrades.includes(grade)) {
      return res.status(403).json({
        message: 'El grado no está asignado a este docente.',
      });
    }

    // 4️⃣ Crear tarea
    const task = new Task({
      title,
      subject,
      capacities,
      topic,
      indicators,
      dueDate,
      status,
      grade,
      institution: teacher.institution,
      teacher: teacher._id,
    });

    await task.save();

    res.status(201).json({
      message: 'Tarea creada exitosamente.',
      task,
    });

  } catch (error) {
    console.error('Error al crear la tarea:', error);
    res.status(500).json({ message: 'Error al crear la tarea.' });
  }
};

// Obtener todas las tareas (según rol)
exports.getTasks = async (req, res) => {
  try {
    let filter = {};

    // Docente: solo sus tareas
    if (req.user.role === 'docente') {
      filter.teacher = req.user.userId;
    }

    const tasks = await Task.find(filter)
      .populate('institution', 'name')
      .populate('teacher', 'firstName lastName');

    res.status(200).json(tasks);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las tareas.' });
  }
};

// Obtener tareas por grado (para estudiantes)
exports.getTasksByGrade = async (req, res) => {
  try {
    const { grade } = req.params;

    const tasks = await Task.find({
      grade,
      institution: req.user.institution,
      status: 'publicada',
    });

    res.status(200).json(tasks);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tareas por grado.' });
  }
};

// Obtener una tarea por ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('teacher', 'firstName lastName');

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    res.status(200).json(task);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la tarea.' });
  }
};

// Actualizar tarea
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    // Solo el docente creador
    if (task.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'No autorizado.' });
    }

    Object.assign(task, req.body);
    await task.save();

    res.status(200).json({
      message: 'Tarea actualizada exitosamente.',
      task,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la tarea.' });
  }
};

// Eliminar tarea
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    if (task.teacher.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'No autorizado.' });
    }

    await task.deleteOne();

    res.status(200).json({ message: 'Tarea eliminada correctamente.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la tarea.' });
  }
};
