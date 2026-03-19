const Student = require('../models/Student');
const User = require('../models/User');
const StudentTask = require('../models/StudentTask');
const Task = require('../models/Task'); // 👈 IMPORTANTE: Añadir esta importación


// ================================
// CREAR ESTUDIANTE + ASIGNAR TAREAS EXISTENTES
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
      password,
      // ... otros campos que ya recibes
    } = req.body;

    const exists = await Student.findOne({ cedula });
    if (exists) return res.status(400).json({ message: 'Ya existe un estudiante con esta cédula.' });

    // 1. Crear USER
    const user = new User({
      firstName,
      lastName,
      password,
      idNumber: cedula,
      birthDate,
      institution,
      role: 'estudiante',
      grades: [grade],
      isActive: true, 
    });
    await user.save();

    // 2. Crear STUDENT
    const student = new Student({
      ...req.body, // Simplificamos usando spread pero aseguramos el vínculo con user
      user: user._id,
      createdBy: req.user.userId,
    });
    await student.save();

    // ============================================================
    // ⚡ LÓGICA DE ASIGNACIÓN AUTOMÁTICA DE TAREAS PREVIAS
    // ============================================================
    
    // Buscamos tareas que ya existan para ese grado e institución y estén publicadas
    const existingTasks = await Task.find({
      grade: grade,
      institution: institution,
      status: "publicada"
    });

    if (existingTasks.length > 0) {
      const studentTasksToCreate = existingTasks.map(task => {
        const base = {
          task: task._id,
          student: student._id,
          status: "pendiente",
          score: 0,
          comments: ""
        };

        // Inicializar según el tipo de instrumento (Igual que en tu TaskController)
        if (task.instrumentType === "lista_cotejo" || task.instrumentType === "rsa") {
          base.indicatorScores = [];
        }

        if (task.instrumentType === "rsa") {
          base.rsaResults = [
            { moment: 1, result: null },
            { moment: 2, result: null },
            { moment: 3, result: null }
          ];
          base.rsaFinalResult = null;
        }

        if (task.instrumentType === "rubrica") {
          base.rubricScores = (task.rubricCriteria || []).map(c => ({
            criterion: c.criterion,
            level: null,
            points: 0
          }));
        }

        return base;
      });

      // Insertamos todas las tareas de golpe
      await StudentTask.insertMany(studentTasksToCreate);
      console.log(`Se asignaron ${existingTasks.length} tareas previas al estudiante ${firstName}`);
    }

    res.status(201).json({ 
      message: 'Estudiante creado y tareas asignadas correctamente.',
      tasksAssigned: existingTasks.length 
    });

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
      .populate('user', 'firstName lastName email idNumber isActive');
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
exports.getMyProfile = async (req, res) => {
  try {
    console.log('getMyProfile called, req.user:', req.user);

    const userId = req.user?.userId; 
    console.log('User ID usado para buscar en la colección de Students:', userId);

    if (!userId) {
      return res.status(400).json({ message: "Usuario no autenticado" });
    }

    // 🔹 CAMBIO CLAVE: Buscamos por el campo 'user', no por el '_id' del estudiante
    const student = await Student.findOne({ user: userId })
      .populate('institution'); // Puedes popular la institución si quieres mostrar el nombre

    if (!student) {
      console.log('Student not found for user:', userId);
      return res.status(404).json({ message: "Student not found" });
    }

    console.log('Student found:', student.firstName, student.lastName);
    res.json(student);

  } catch (error) {
    console.error('Error en getMyProfile:', error);
    res.status(500).json({ message: error.message });
  }
};
exports.toggleStudentStatus = async (req, res) => {
  try {
    // 1. Buscamos al estudiante y hacemos populate del usuario para estar seguros
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    // 2. Buscamos al usuario usando el ID guardado en student.user
    const user = await User.findById(student.user);

    if (!user) {
      return res.status(404).json({ message: 'Usuario asociado no encontrado' });
    }

    // 3. Cambiamos el estado
    user.isActive = !user.isActive;
    
    // 4. Usamos markModified si isActive es un esquema anidado (opcional pero seguro)
    // user.markModified('isActive'); 

    await user.save();

    // 5. IMPORTANTE: Enviamos la respuesta con el nuevo estado
    return res.json({
      message: 'Estado actualizado correctamente',
      isActive: user.isActive // Esto es lo que lee tu frontend
    });

  } catch (error) {
    console.error("Error en toggleStudentStatus:", error);
    res.status(500).json({ message: 'Error al cambiar estado' });
  }
};