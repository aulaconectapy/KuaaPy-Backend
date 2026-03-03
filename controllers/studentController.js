const Student = require('../models/Student');
const User = require('../models/User');
const Task = require('../models/Task');
const StudentTask = require('../models/StudentTask');

// ================================
// CREAR ESTUDIANTE
exports.createStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      cedula,
      birthDate,
      institution,
      grade,
      guardian,
      password
    } = req.body;

    const exists = await Student.findOne({ cedula });
    if (exists) return res.status(400).json({ message: 'Ya existe un estudiante con esta cédula.' });

    // 🔐 Crear USER inactivo
    const user = new User({
      firstName,
      lastName,
      password,
      idNumber: cedula,
      birthDate,
      institution,
      role: 'estudiante',
      grades: [grade],
      isActive: false, // ⚡ Inactivo hasta activar
    });
    await user.save();

    // 🎓 Crear STUDENT
    const student = new Student({
      firstName,
      lastName,
      cedula,
      birthDate,
      institution,
      grade,
      guardian,
      user: user._id,
      createdBy: req.user.userId,
    });
    await student.save();

    res.status(201).json({ message: 'Estudiante creado correctamente. Pendiente de activación' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear estudiante', error: error.message });
  }
};


// ================================
// OBTENER TODOS
// ================================
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('institution', 'name');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estudiantes' });
  }
};

// ================================
// OBTENER POR ID
// ================================
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estudiante' });
  }
};

// ================================
// ACTUALIZAR

// ACTUALIZAR ESTUDIANTE
exports.updateStudent = async (req, res) => {
  try {
    const { firstName, lastName, birthDate, institution, grade, guardian, password } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Estudiante no encontrado' });

    student.firstName = firstName ?? student.firstName;
    student.lastName = lastName ?? student.lastName;
    student.birthDate = birthDate ?? student.birthDate;
    student.institution = institution ?? student.institution;
    student.grade = grade ?? student.grade;
    student.guardian = guardian ?? student.guardian;

    await student.save();

    if (password) {
      const user = await User.findById(student.user);
      user.password = password;
      await user.save();
    }

    res.json({ message: 'Estudiante actualizado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar estudiante', error: error.message });
  }
};

// ================================
// ELIMINAR
// ================================
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    await student.deleteOne();

    res.json({
      message: 'Estudiante eliminado'
    });

  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar estudiante' });
  }
};

// ================================
// MIS TAREAS (ESTUDIANTE LOGUEADO)
// ================================
exports.getMyTasks = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.userId });

    if (!student) {
      return res.status(404).json({
        message: 'Estudiante no encontrado',
      });
    }

    const tasks = await StudentTask.find({ student: student._id })
      .populate('task');

    res.json(tasks);

  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener tareas',
    });
  }
};