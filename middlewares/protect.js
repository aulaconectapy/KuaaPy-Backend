const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ PASAR TODO LO NECESARIO
      req.user = {
        userId: decoded.userId,
        role: decoded.role, // 👈🔥 ESTA ERA LA CLAVE
      };

      next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: 'Token no válido o expirado' });
    }
  } else {
    return res
      .status(401)
      .json({ message: 'No autorizado, token no proporcionado' });
  }
};

module.exports = protect;