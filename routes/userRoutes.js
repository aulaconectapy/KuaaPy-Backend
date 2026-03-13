const express = require('express');
const { createUser, loginUser, getUsers, getUserById, deleteUser,updateUser, createDocente, updateMyProfile } = require('../controllers/userController');
const protect = require('../middlewares/protect'); // Middleware de protección
const router = express.Router();

// Ruta para crear un nuevo usuario y loguearse automáticamente
router.post('/register', createUser);

// Ruta para iniciar sesión
router.post('/login', loginUser);

// Rutas protegidas
router.get('/', protect, getUsers); // Ver todos los usuarios
router.get('/:userId', protect, getUserById); // Ver un usuario por ID
router.delete('/:userId', protect, deleteUser); // Eliminar un usuario
router.put('/me', protect, updateMyProfile);
router.put('/:userId', protect, updateUser);
router.post('/docentes', protect, createDocente);

module.exports = router;
