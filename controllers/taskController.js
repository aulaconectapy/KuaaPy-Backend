const Task = require('../models/task');
const User = require('../models/User');

// Crear una nueva tarea (solo docentes)
const createTask = async (req, res) => {
  const { subject, description, dueDate, grade, assignedStudents } = req.body;

  if (req.user.role !== 'docente') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const newTask = new Task({
      subject,
      description,
      dueDate,
      grade,
      assignedStudents,
      teacherId: req.user.userId,
    });

    await newTask.save();
    res.status(201).json({ message: 'Tarea creada exitosamente', task: newTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la tarea', error: error.message });
  }
};

// Obtener tareas por grado
const getTasksByGrade = async (req, res) => {
  const { grade } = req.params;

  try {
    const tasks = await Task.find({ grade });
    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
};

// Actualizar el estado de una tarea para un estudiante
const updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { studentId, status } = req.body;

  if (req.user.role !== 'docente') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const studentTask = task.assignedStudents.find(s => s.studentId.toString() === studentId);
    if (!studentTask) {
      return res.status(404).json({ message: 'Estudiante no asignado a esta tarea' });
    }

    studentTask.status = status;
    await task.save();

    res.status(200).json({ message: 'Estado actualizado exitosamente', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
};

// Ver el progreso del estudiante
const getStudentProgress = async (req, res) => {
  const { studentId } = req.params;

  try {
    const tasks = await Task.find({ 'assignedStudents.studentId': studentId });
    const progress = tasks.map(task => ({
      subject: task.subject,
      description: task.description,
      dueDate: task.dueDate,
      status: task.assignedStudents.find(s => s.studentId.toString() === studentId).status,
    }));

    res.status(200).json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el progreso', error: error.message });
  }
};

// Asociar a un padre/madre con un hijo
const associateParent = async (req, res) => {
  const { childId } = req.body;

  if (req.user.role !== 'padre/madre/tutor') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const parent = await User.findById(req.user.userId);
    const child = await User.findById(childId);

    if (!parent || !child) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    parent.associatedChildren.push(childId);
    await parent.save();

    res.status(200).json({ message: 'Asociación exitosa' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al asociar', error: error.message });
  }
};

module.exports = {
  createTask,
  getTasksByGrade,
  updateTaskStatus,
  getStudentProgress,
  associateParent,
};
