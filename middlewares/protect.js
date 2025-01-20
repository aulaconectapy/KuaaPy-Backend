const jwt = require('jsonwebtoken');

// Middleware para verificar el token y decodificarlo
const protect = (req, res, next) => {
  let token;

  // Verificar si hay un token en la cabecera Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]; // Extraer el token

    try {
      // Verificar el token y decodificarlo
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // El token se verifica y decodifica

      // Adjuntar la información del usuario (userId) al objeto req
      req.user = { userId: decoded.userId }; // Aquí es donde agregamos el userId del token decodificado

      next(); // Continuar con la ejecución de la siguiente función o ruta
    } catch (error) {
      res.status(401).json({ message: 'Token no válido o expirado' }); // Si el token no es válido
    }
  } else {
    res.status(401).json({ message: 'No autorizado, token no proporcionado' }); // Si no se proporciona el token
  }
};

module.exports = protect;
