const express = require('express');
const router = express.Router();

const protect = require('../middlewares/protect');
const Student = require('../models/Student'); // <-- importa tu modelo Student

const {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getMyTasks,
  updateMyProfile,
  getMyProfile,
  toggleStudentStatus
} = require('../controllers/studentController');


// ================================
// ESTUDIANTE LOGUEADO
// ================================
router.put('/:id/toggle-status', protect, toggleStudentStatus);

// Obtener perfil del estudiante logueado
router.get('/my-profile', protect, getMyProfile); // 👈 NUEVO

// Obtener MIS tareas
router.get('/my-tasks', protect, getMyTasks);

router.put('/:id/toggle-status', protect, toggleStudentStatus);

// Actualizar perfil del estudiante
router.put('/my-profile', protect, updateMyProfile);
router.get('/', protect, async (req, res) => {
  try {
    const { grade, institution } = req.query;

    // Verifica que se reciba institution
    if (!institution) {
      return res.status(400).json({ message: "Falta el id de la institución" });
    }

    const filter = {};

    if (grade) filter.grade = grade;
    filter.institution = institution; // siempre obligatorio

    const students = await Student.find(filter).select('firstName lastName _id grade');

    res.json(students);

  } catch (error) {
    console.error("Error al obtener estudiantes:", error);
    res.status(500).json({ message: error.message });
  }
});
// ================================
// CRUD ADMINISTRADOR / DOCENTE
// ================================

// Crear estudiante
router.post('/', protect, createStudent);

// Obtener todos
router.get('/', protect, getAllStudents);

// Obtener por ID
router.get('/:id', protect, getStudentById);

// Actualizar
router.put('/:id', protect, updateStudent);

// Eliminar
router.delete('/:id', protect, deleteStudent);

module.exports = router;