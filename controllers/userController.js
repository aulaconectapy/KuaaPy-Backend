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
  { 
    userId: user._id,
    role: user.role,
    institution: user.institution._id // 🔹 agregar esto
  },
  process.env.JWT_SECRET,
  { expiresIn: '120m' }
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

    console.log("==== UPDATE USER REQUEST ====");
    console.log("Usuario que hace la petición:", req.user);
    console.log("ID del usuario a editar:", req.params.userId);
    console.log("Datos recibidos:", req.body);

    const { userId } = req.params;
    const { isActive, password, ...otherFields } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      console.log("❌ Usuario no encontrado");
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.log("Usuario encontrado en DB:", user._id);

    // ============================
    // 🔹 Actualizar campos generales
    Object.keys(otherFields).forEach(field => {
      console.log(`Actualizando campo: ${field} ->`, otherFields[field]);
      user[field] = otherFields[field] ?? user[field];
    });

    // ============================
    // 🔐 CAMBIO DE CONTRASEÑA
    if (password && password.trim() !== '') {

      console.log("🔐 Intentando cambiar contraseña");
      console.log("Rol del usuario que edita:", req.user.role);

      if (
        req.user.role === 'administrador' ||
        req.user.role === 'director/a'
      ) {
        console.log("✅ Permiso concedido para cambiar contraseña");
        user.password = password; // 👉 se encripta en pre('save')
      } else {
        console.log("⛔ BLOQUEADO: sin permisos para cambiar contraseña");
        return res.status(403).json({
          message: 'No tienes permisos para cambiar la contraseña'
        });
      }
    }

    // ============================
    // 🔒 CONTROL DE ACTIVACIÓN
    if (typeof isActive !== 'undefined') {

      console.log("Intentando cambiar isActive a:", isActive);
      console.log("Rol del usuario que edita:", req.user.role);

      if (
        req.user.role === 'administrador' ||
        req.user.role === 'director/a'
      ) {
        console.log("✅ Permiso concedido para cambiar isActive");
        user.isActive = isActive;
      } else {
        console.log("⛔ BLOQUEADO: usuario sin permisos para cambiar isActive");
        return res.status(403).json({
          message: 'No tienes permisos para cambiar el estado del usuario'
        });
      }
    }

    // ============================
    await user.save(); // 🔥 CLAVE (activa bcrypt)

    console.log("✅ Usuario actualizado correctamente");

    const userObject = user.toObject();
    delete userObject.password;

    res.json({
      message: 'Usuario actualizado correctamente',
      user: userObject,
    });

  } catch (error) {

    console.error("🔥 ERROR UPDATE USER:", error);

    res.status(500).json({
      message: 'Error al actualizar usuario',
      error: error.message
    });

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
// Actualizar mi propio perfil
const updateMyProfile = async (req, res) => {
  try {
    console.log('==== UPDATE MY PROFILE REQUEST ====');

    const userId = req.user.userId;

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      birthDate,
      idNumber,
      password // 🔥 AGREGADO
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 🔹 Datos normales
    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.email = email ?? user.email;
    user.phoneNumber = phoneNumber ?? user.phoneNumber;
    user.birthDate = birthDate ?? user.birthDate;
    user.idNumber = idNumber ?? user.idNumber;

    // 🔐 Cambio de contraseña
    if (password && password.trim() !== '') {
      console.log('🔐 Usuario actualizando su contraseña');
      user.password = password; // 👉 se encripta en pre('save')
    }

    await user.save(); // 🔥 CLAVE

    const userObject = user.toObject();
    delete userObject.password;

    res.json({
      message: 'Perfil actualizado correctamente',
      user: userObject
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Error al actualizar perfil',
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
  createDocente,
  updateMyProfile
};