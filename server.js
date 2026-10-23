const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const dotenv = require('dotenv');
const cors = require('cors');

// Configuraciones y Servicios
const connectDB = require('./config/db');
const syncData = require('./services/syncService'); // <--- IMPORTAMOS EL SINCRONIZADOR

// Rutas
const userRoutes = require('./routes/userRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const studentTaskRoutes = require('./routes/studentTaskRoutes');
const studentRoutes = require('./routes/studentRoutes');
const disciplineReportRoutes = require("./routes/disciplineReportRoutes");
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notifications');
const planificacionRoutes = require('./routes/planificacionRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'https://aulaconectapy.netlify.app',
  'https://colegioprivadomariaauxiliadora.netlify.app',
  'https://kuaapy.netlify.app/',
  'https://localhost:5000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));

// SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Guardar usuarios conectados
const connectedUsers = {};

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("join", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log("Usuario unido:", userId);
  });

  socket.on("disconnect", () => {
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
});

// Hacer accesible socket en rutas
app.set("io", io);
app.set("connectedUsers", connectedUsers);

app.use(express.json());

// RUTAS
app.use('/api/auth', userRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/tasks', studentTaskRoutes);
app.use('/api/tasksTeacher', taskRoutes);
app.use('/api/report', disciplineReportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/planificaciones', planificacionRoutes);

// INICIO DEL SERVIDOR Y BASE DE DATOS
// --- 1. DEFINIR EL PUERTO PRIMERO ---
const PORT = process.env.PORT || 5000;

// --- 2. ARRANCAR EL SERVIDOR EXPRESS ---
server.listen(PORT, () => {
    console.log(`🚀 Servidor Express corriendo en puerto ${PORT}`);

    // --- 3. CONECTAR LA BASE DE DATOS EN SEGUNDO PLANO ---
    connectDB()
        .then(() => {
            console.log("🛠️ Lógica de Base de Datos inicializada.");
            
            // 4. Ejecutar sincronización inicial
            syncData();

            // 5. Programar sincronización cada 10 minutos
            setInterval(() => {
                console.log("🔄 Iniciando ciclo de sincronización programada...");
                syncData();
            }, 10 * 60 * 1000);
        })
        .catch(err => {
            console.error("❌ La base de datos falló en todos los intentos:", err.message);
        });
});