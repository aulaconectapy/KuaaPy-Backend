const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ================================
// Crear un nuevo usuario
const createUser = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    idNumber,
    birthDate,
    institution, // ✅ usamos solo institution
    grades,
    phoneNumber,
    role,
    associatedChildren
  } = req.body;

  try {
    // Verificar duplicados
    const existingUser = await User.findOne({ $or: [{ email }, { idNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Correo o número de cédula ya registrado' });
    }

    // Crear usuario inactivo por defecto
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      idNumber,
      birthDate,
      institution,
      grades,
      phoneNumber,
      role,
      associatedChildren,
      isActive: true, // ⚡ Inactivo hasta activación por admin/director
    });

    await newUser.save();

    res.status(201).json({ message: 'Usuario creado correctamente. Pendiente de activación' });

  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
  }
};

// ================================
// Login con CÉDULA (idNumber)
const loginUser = async (req, res) => {
  const { idNumber, password } = req.body;

  try {
    const user = await User.findOne({ idNumber });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Usuario inactivo. Contacta al administrador.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    res.status(200).json({ message: 'Login exitoso', token, role: user.role });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

// ================================
// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('institution', 'name grades');
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
};

// ================================
// Obtener usuario por ID
const getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('institution');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const userObject = user.toObject();
    delete userObject.password;

    res.status(200).json(userObject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el usuario', error: error.message });
  }
};

// ================================
// Eliminar usuario
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
  }
};

// ================================
// Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, password, ...otherFields } = req.body; // Separar isActive y password

    // Evitar cambiar password acá (opcional)
    if (password) {
      delete req.body.password;
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Actualizar campos generales
    Object.keys(otherFields).forEach(field => {
      user[field] = otherFields[field] ?? user[field];
    });

    // 🔒 Solo admin/director pueden cambiar isActive
    if (typeof isActive !== 'undefined') {
      if (req.user.role === 'administrador' || req.user.role === 'director/a') {
        user.isActive = isActive;
      } else {
        return res.status(403).json({ message: 'No tienes permisos para cambiar el estado del usuario' });
      }
    }

    await user.save();

    const userObject = user.toObject();
    delete userObject.password; // No enviar password al frontend

    res.json({
      message: 'Usuario actualizado correctamente',
      user: userObject,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};
// ================================
// Crear docente (SOLO ADMIN / DIRECTOR / SECRETARIO)
// ================================
const createDocente = async (req, res) => {
  try {
    // 🔐 Validar permisos
    if (
      req.user.role !== 'administrador' &&
      req.user.role !== 'director/a' &&
      req.user.role !== 'secretario/a'
    ) {
      return res.status(403).json({
        message: 'No tienes permisos para crear docentes'
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      idNumber,
      birthDate,
      institution,
      grades,
      phoneNumber
    } = req.body;

    // 🔎 Validar duplicados
    const existingUser = await User.findOne({
      $or: [{ email }, { idNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Correo o número de cédula ya registrado'
      });
    }

    // 🏫 Si es director o secretario, forzar institución
    let assignedInstitution = institution;

    if (
      req.user.role === 'director/a' ||
      req.user.role === 'secretario/a'
    ) {
      assignedInstitution = req.user.institution;
    }

    const newDocente = new User({
      firstName,
      lastName,
      email,
      password,
      idNumber,
      birthDate,
      institution: assignedInstitution,
      grades,
      phoneNumber,
      role: 'docente', // 🔥 FORZADO
      isActive: true,  // puedes decidir si activar directo o no
    });

    await newDocente.save();

    res.status(201).json({
      message: 'Docente creado correctamente',
      docente: newDocente
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al crear docente',
      error: error.message
    });
  }
};
module.exports = {
  createUser,
  loginUser,
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
  createDocente
};