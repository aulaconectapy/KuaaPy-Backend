const mongoose = require('mongoose');

const connectDB = async () => {
  // Intentamos primero la conexión a la Nube (Atlas)
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Conectado a MongoDB Atlas: ${conn.connection.host}`);
    return conn; // Retornamos la conexión exitosa
  } 
  catch (error) {
    console.error(`⚠️ Error en Atlas (Sin internet o Clúster offline): ${error.message}`);
    
    // Si falla Atlas, intentamos conectar al MongoDB local de tu PC
    try {
      console.log("🏠 Intentando conectar a MongoDB Local...");
      const localConn = await mongoose.connect(process.env.MONGODB_URI_LOCAL);
      console.log(`✅ Conectado a MongoDB Local: ${localConn.connection.host}`);
      return localConn;
    } 
    catch (localError) {
      console.error(`❌ Error crítico: No hay conexión local ni remota. ${localError.message}`);
      // En lugar de cerrar la app de golpe, podrías lanzar el error 
      // para manejarlo en tu server.js, pero process.exit(1) es seguro para evitar datos corruptos.
      process.exit(1); 
    }
  }
};

module.exports = connectDB;