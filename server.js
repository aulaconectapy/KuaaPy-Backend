const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const apiTask = require('./routes/taskRoutes');

const dotenv = require('dotenv');
const cors = require('cors');


dotenv.config();

const app = express();
const allowedOrigins = [
  'http://localhost:3000',
  'https://aulaconectapy.netlify.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como las hechas desde herramientas de prueba)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
  credentials: true, // Permite cookies/sesiones si es necesario
}));
// Conectar a la base de datos
connectDB();

// Middleware
app.use(express.json()); // Para parsear el cuerpo de las solicitudes como JSON

// Rutas
app.use('/api/auth', userRoutes);
app.use('/api/institutions', institutionRoutes);  // Usamos las rutas para /institutions
app.use('/api/tasks', apiTask);  

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
