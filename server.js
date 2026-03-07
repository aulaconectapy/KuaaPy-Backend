const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const studentTaskRoutes = require('./routes/studentTaskRoutes');

const studentRoutes = require('./routes/studentRoutes');
const reportRoutes = require("./routes/reportRoutes");
const StudentTask = require("./models/StudentTask");
const taskRoutes = require('./routes/taskRoutes');

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
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Conectar a la base de datos
connectDB();

// Middleware
app.use(express.json());

// RUTAS CORRECTAS
app.use('/api/auth', userRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/students', studentRoutes); // Solo para gestión de perfiles de alumnos
app.use('/api/tasks', studentTaskRoutes);      // Aquí viven tanto tareas generales como entregas

app.use('/api/tasksTeacher', taskRoutes);      // Aquí viven tanto tareas generales como entregas


app.use('/api/reports', reportRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});