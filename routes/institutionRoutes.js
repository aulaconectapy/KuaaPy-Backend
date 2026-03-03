const express = require('express');
const router = express.Router();
const institutionController = require('../controllers/institutionController');  // Asegúrate de que la ruta sea correcta
const protect = require('../middlewares/protect'); // Middleware de protección

// Crear una institución
router.post('/', protect, institutionController.createInstitution);

// Obtener todas las instituciones
router.get('/', institutionController.getAllInstitutions);

// Obtener una institución por ID
router.get('/:id', protect, institutionController.getInstitutionById);

// Actualizar una institución por ID
router.put('/:id', protect, institutionController.updateInstitution);

// Eliminar una institución por ID
router.delete('/:id', protect, institutionController.deleteInstitution);

module.exports = router;
