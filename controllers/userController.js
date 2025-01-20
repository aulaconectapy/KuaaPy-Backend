const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Crear un nuevo usuario y iniciar sesión automáticamente
const createUser = async (req, res) => {
  const { firstName, lastName, email, password, idNumber, birthDate, institution, grade, phoneNumber, role, associatedInstitution, associatedChildren } = req.body;

  // Log para ver los datos recibidos en la solicitud
  console.log('Datos recibidos para crear usuario:', req.body);

  try {
    // Verificar si el correo electrónico o el ID ya existen
    const existingUser = await User.findOne({ $or: [{ email }, { idNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo electrónico o el número de identificación ya están registrados' });
    }

    // Crear el nuevo usuario
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      idNumber,
      birthDate,
      institution,
      grade,
      phoneNumber,
      role,
      associatedInstitution,
      associatedChildren,
    });

    await newUser.save();

    // Iniciar sesión automáticamente: crear un token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Expiración de 1 hora
    );

    // Log para verificar que el usuario fue creado correctamente
    console.log('Usuario creado exitosamente:', newUser);

    res.status(201).json({ message: 'Usuario creado y sesión iniciada', token });
  } catch (error) {
    // Log para ver el error en caso de fallo
    console.error('Error al crear el usuario:', error);

    res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
  }
};

// Iniciar sesión con correo y contraseña
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Log para ver los datos recibidos en la solicitud de login
  console.log('Datos recibidos para iniciar sesión:', req.body);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    // Crear el token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Log para verificar el éxito del login
    console.log('Login exitoso para el usuario:', user);

    res.status(200).json({ message: 'Login exitoso', token });
  } catch (error) {
    // Log para ver el error en caso de fallo
    console.error('Error al iniciar sesión:', error);

    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    // Log para ver el error al obtener los usuarios
    console.error('Error al obtener los usuarios:', error);

    res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
  }
};

// Obtener un usuario por su ID
const getUserById = async (req, res) => {
  const { userId } = req.params;

  // Log para ver el ID recibido
  console.log('ID de usuario recibido:', userId);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(user);
  } catch (error) {
    // Log para ver el error en caso de fallo
    console.error('Error al obtener el usuario:', error);

    res.status(500).json({ message: 'Error al obtener el usuario', error: error.message });
  }
};

// Eliminar un usuario
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  // Log para ver el ID recibido para eliminar
  console.log('ID de usuario para eliminar:', userId);

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    // Log para ver el error en caso de fallo
    console.error('Error al eliminar el usuario:', error);

    res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
  }
};

module.exports = {
  createUser,
  loginUser,
  getUsers,
  getUserById,
  deleteUser,
};
