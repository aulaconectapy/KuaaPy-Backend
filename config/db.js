const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Eliminar las opciones useNewUrlParser y useUnifiedTopology
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error al conectar a MongoDB: ${error.message}`);
    process.exit(1); // Termina el proceso si no se puede conectar a la base de datos
  }
};

module.exports = connectDB;
