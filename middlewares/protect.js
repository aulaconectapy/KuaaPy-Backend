const jwt = require('jsonwebtoken');

// Middleware para verificar el token
const protect = (req, res, next) => {
  let token;

  // Verificar si hay un token en la cabecera Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener el token del header Authorization
      token = req.headers.authorization.split(' ')[1];

      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Clave secreta

      // Adjuntar la información del usuario a la solicitud
      req.user = { userId: decoded.userId, role: decoded.role };

      next(); // Continuar con la ejecución de la siguiente función o ruta
    } catch (error) {
      res.status(401).json({ message: 'No autorizado, token no válido' }); // Si el token es inválido
    }
  } else {
    // Si no se proporciona el token
    res.status(401).json({ message: 'No autorizado, no token' });
  }
};

module.exports = protect;
