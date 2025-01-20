const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Para generar el token

// Crear un nuevo estudiante
exports.createStudent = async (req, res) => {
  try {
      const { firstName, lastName, birthDate, institution, grade, guardian, password } = req.body;

      // Imprimir los datos recibidos para depuración
      console.log('Datos recibidos:', { firstName, lastName, birthDate, institution, grade, guardian, password });

      // Verificamos si el estudiante ya está registrado por su cédula o guardian (si eso es lo que se espera)
      const studentExists = await Student.findOne({ guardian }); // O podrías cambiarlo a un campo como `cedula`
      if (studentExists) {
          return res.status(400).json({ message: 'Este estudiante ya está registrado.' });
      }

      // Creamos el nuevo estudiante
      const student = new Student({
          firstName,
          lastName,
          birthDate,
          institution,
          grade,
          guardian,
          password, // La contraseña será encriptada en el middleware 'pre-save' del modelo
          createdBy: req.user.userId, // Asumimos que el usuario está autenticado y obtenemos el userId
      });

      // Guardamos el estudiante
      await student.save();

      res.status(201).json({
          message: 'Estudiante creado exitosamente',
          student: student._id, // Retornamos el ID del estudiante creado
      });
  } catch (error) {
      console.error("Error al crear el estudiante:", error);
      res.status(500).json({ message: 'Error al crear el estudiante.' });
  }
};

  

// Obtener todos los estudiantes
exports.getAllStudents = async (req, res) => {
  try {
    // Usar populate para incluir datos de la institución
    const students = await Student.find().populate('institution', 'name');
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los estudiantes.' });
  }
};


// Obtener un estudiante por ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }
    res.status(200).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el estudiante.' });
  }
};

// Actualizar un estudiante
exports.updateStudent = async (req, res) => {
  try {
    const { firstName, lastName, birthDate, institution, grade, guardian, password } = req.body;

    // Buscamos el estudiante por ID
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }

    // Actualizamos los campos
    student.firstName = firstName || student.firstName;
    student.lastName = lastName || student.lastName;
    student.birthDate = birthDate || student.birthDate;
    student.institution = institution || student.institution;
    student.grade = grade || student.grade;
    student.guardian = guardian || student.guardian;

    // Si se proporciona una nueva contraseña, la encriptamos
    if (password) {
      student.password = password;
      const salt = await bcrypt.genSalt(10);
      student.password = await bcrypt.hash(student.password, salt);
    }

    // Guardamos los cambios
    await student.save();

    res.status(200).json({ message: 'Estudiante actualizado exitosamente', student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el estudiante.' });
  }
};

// Eliminar un estudiante
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }

    await student.remove();
    res.status(200).json({ message: 'Estudiante eliminado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el estudiante.' });
  }
};

// Iniciar sesión con cédula y contraseña
exports.loginStudent = async (req, res) => {
  const { guardian, password } = req.body; // Suponiendo que 'guardian' es la cédula del estudiante

  try {
    // Buscar el estudiante por la cédula (guardian)
    const student = await Student.findOne({ guardian });
    if (!student) {
      return res.status(400).json({ message: 'Cédula o contraseña incorrectos.' });
    }

    // Verificar la contraseña
    const isMatch = await student.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Cédula o contraseña incorrectos.' });
    }

    // Generar el token JWT
    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token, // Devolver el token al cliente
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
};
