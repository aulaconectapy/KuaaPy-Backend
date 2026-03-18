const express = require('express');
const router = express.Router();
const protect = require('../middlewares/protect'); // Tu middleware existente
const {
    createPlanificacion,
    getPlanificaciones,
    getPlanificacionById,
    updatePlanificacion,
    deletePlanificacion,
    updateStatus
} = require('../controllers/planificacionController');

// Todas las rutas de planificación estarán protegidas
router.use(protect);

// Ruta para crear y obtener (lista general filtrada por rol en el controlador)
router.route('/')
    .post(createPlanificacion)
    .get(getPlanificaciones);

// Rutas para operaciones individuales
router.route('/:id')
    .get(getPlanificacionById)
    .put(updatePlanificacion)
    .delete(deletePlanificacion);

// Ruta específica para que el docente envíe o el director apruebe/rechace
router.patch('/:id/status', updateStatus);

module.exports = router;