const Student = require('../models/Student');
const User = require('../models/User');
const StudentTask = require('../models/StudentTask');

// ================================
// CREAR ESTUDIANTE
// ================================
exports.createStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      sex,
      cedula,
      birthDate,
      institution,
      grade,
      guardian,
      father,
      mother,
      allergies,
      healthIssues,
      reasonableAdjustments,
      address,
      observations,
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
      sex,
      cedula,
      birthDate,
      institution,
      grade,
      guardian,
      father,
      mother,
      allergies,
      healthIssues,
      reasonableAdjustments,
      address,
      observations,
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
// OBTENER TODOS LOS ESTUDIANTES
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
// OBTENER ESTUDIANTE POR ID
// ================================
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('institution', 'name')
      .populate('user', 'firstName lastName email idNumber');
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estudiante' });
  }
};

// ================================
// ACTUALIZAR ESTUDIANTE (ADMIN/CREADOR)
// ================================
exports.updateStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      sex,
      birthDate,
      grade, // ⚠️ no permitir cambiar institution desde aquí
      guardian,
      father,
      mother,
      allergies,
      healthIssues,
      reasonableAdjustments,
      address,
      observations,
      password
    } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Estudiante no encontrado' });

    // Actualización de campos
    student.firstName = firstName ?? student.firstName;
    student.lastName = lastName ?? student.lastName;
    student.sex = sex ?? student.sex;
    student.birthDate = birthDate ?? student.birthDate;
    student.grade = grade ?? student.grade;
    student.guardian = guardian ?? student.guardian;
    student.father = father ?? student.father;
    student.mother = mother ?? student.mother;
    student.allergies = allergies ?? student.allergies;
    student.healthIssues = healthIssues ?? student.healthIssues;
    student.reasonableAdjustments = reasonableAdjustments ?? student.reasonableAdjustments;
    student.address = address ?? student.address;
    student.observations = observations ?? student.observations;

    await student.save();

    // Actualizar contraseña si se provee
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
// ACTUALIZAR PERFIL DEL ESTUDIANTE (PADRES/ALUMNOS)
// ⚠️ No permite cambiar grado ni institución
// ================================
exports.updateMyProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.userId });
    if (!student) return res.status(404).json({ message: 'Estudiante no encontrado' });

    const {
      firstName,
      lastName,
      sex,
      birthDate,
      guardian,
      father,
      mother,
      allergies,
      healthIssues,
      reasonableAdjustments,
      address,
      observations,
      password
    } = req.body;

    // Actualizar campos permitidos
    student.firstName = firstName ?? student.firstName;
    student.lastName = lastName ?? student.lastName;
    student.sex = sex ?? student.sex;
    student.birthDate = birthDate ?? student.birthDate;
    student.guardian = guardian ?? student.guardian;
    student.father = father ?? student.father;
    student.mother = mother ?? student.mother;
    student.allergies = allergies ?? student.allergies;
    student.healthIssues = healthIssues ?? student.healthIssues;
    student.reasonableAdjustments = reasonableAdjustments ?? student.reasonableAdjustments;
    student.address = address ?? student.address;
    student.observations = observations ?? student.observations;

    await student.save();

    // Actualizar contraseña si se provee
    if (password) {
      const user = await User.findById(student.user);
      user.password = password;
      await user.save();
    }

    res.json({ message: 'Perfil actualizado correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
  }
};

// ================================
// ELIMINAR ESTUDIANTE
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
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    const tasks = await StudentTask.find({ student: student._id })
      .populate('task');

    res.json(tasks);

  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tareas' });
  }
};