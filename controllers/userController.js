const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Crear un nuevo usuario y generar token
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

  console.log('Datos recibidos para crear usuario:', req.body);

  try {
    // Verificar duplicados
    const existingUser = await User.findOne({ $or: [{ email }, { idNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Correo o número de ID ya registrado' });
    }

    // Crear usuario
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      idNumber,
      birthDate,
      institution, // ✅ campo correcto
      grades,
      phoneNumber,
      role,
      associatedChildren,
      isActive: false
    });

    await newUser.save();

    // Crear token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Usuario creado exitosamente:', newUser);

    res.status(201).json({ message: 'Usuario creado y sesión iniciada', token });

  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ message: 'Error al crear el usuario', error: error.message });
  }
};

// Iniciar sesión
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  console.log('Datos recibidos para iniciar sesión:', req.body);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
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

    console.log('Login exitoso para el usuario:', user);

    res.status(200).json({ message: 'Login exitoso', token });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

// Obtener todos los usuarios
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('institution', 'name grades'); // ✅ populate correcto
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
  const { userId } = req.params;

  console.log('ID de usuario recibido:', userId);

  try {
    const user = await User.findById(userId)
      .populate('institution'); // ✅ populate correcto

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // No enviar password al frontend
    const userObject = user.toObject();
    delete userObject.password;

    res.status(200).json(userObject);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ message: 'Error al obtener el usuario', error: error.message });
  }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  console.log('ID de usuario para eliminar:', userId);

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
  }
};

// Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Evitar cambiar password acá (opcional)
    if (req.body.password) {
      delete req.body.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      req.body,
      { new: true }
    ).populate('institution'); // ✅ populate correcto

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

module.exports = {
  createUser,
  loginUser,
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
};
