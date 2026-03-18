const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const studentTaskRoutes = require('./routes/studentTaskRoutes');
const studentRoutes = require('./routes/studentRoutes');
const disciplineReportRoutes = require("./routes/disciplineReportRoutes");
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notifications');
const planificacionRoutes = require('./routes/planificacionRoutes');

const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'https://aulaconectapy.netlify.app',
  'https://colegioprivadomariaauxiliadora.netlify.app'
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

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// guardar usuarios conectados
const connectedUsers = {};

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("join", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log("Usuario unido:", userId);
  });

  // Cuando un usuario se desconecta, eliminarlo de connectedUsers
  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);

    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        console.log("Usuario removido de connectedUsers:", userId);
        break;
      }
    }
  });
});

// hacer accesible socket en rutas
app.set("io", io);
app.set("connectedUsers", connectedUsers);

// conectar base de datos
connectDB();

app.use(express.json());

// rutas
app.use('/api/auth', userRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/tasks', studentTaskRoutes);
app.use('/api/tasksTeacher', taskRoutes);
app.use('/api/report', disciplineReportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/planificaciones', planificacionRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});