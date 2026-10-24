const Institution = require('../models/institutionModel'); // Asegúrate de que la ruta sea correcta según tu estructura de carpetas

// Crear una nueva institución
exports.createInstitution = async (req, res) => {
  try {
    // Log de los datos recibidos
    console.log('Datos recibidos desde el frontend:', req.body);

    const { name, number, address, phoneNumber, director, secretary, grades, logoUrl } = req.body;

    // Validar campos obligatorios básicos
    if (!name || !number || !address) {
      return res.status(400).json({ 
        message: 'Por favor, completa los campos obligatorios: name, number y address.' 
      });
    }

    // Verificar duplicados manualmente antes de guardar (opcional, pero ayuda a dar un mensaje más limpio)
    const existingInstitution = await Institution.findOne({ $or: [{ name }, { number }] });
    if (existingInstitution) {
      const field = existingInstitution.name === name ? 'nombre' : 'número';
      return res.status(400).json({ 
        message: `Ya existe una institución registrada con ese ${field}.` 
      });
    }

    const institution = new Institution({ 
      name, 
      number, 
      address, 
      phoneNumber, 
      director, 
      secretary, 
      grades: grades || [], 
      logoUrl 
    });

    await institution.save();
    return res.status(201).json(institution);

  } catch (error) {
    console.error('Error al crear institución:', error);

    // Error de validación de Mongoose (ej: regex de teléfono, número no numérico, etc.)
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Por favor, corrige los siguientes errores:', 
        errors: errorMessages, // Lista limpia de mensajes para mostrar
        details: error.errors 
      });
    }

    // Error por índice único duplicado en MongoDB (Código 11000)
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      const duplicatedValue = error.keyValue[duplicatedField];
      return res.status(400).json({ 
        message: `El valor '${duplicatedValue}' para el campo '${duplicatedField}' ya se encuentra registrado en otra institución.` 
      });
    }

    return res.status(500).json({ message: 'Hubo un error interno al crear la institución.' });
  }
};

// Actualizar una institución por ID
exports.updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    // Log de los datos recibidos
    console.log('Datos recibidos para actualizar:', req.body);

    const { name, number, address, phoneNumber, director, secretary, grades, logoUrl } = req.body;

    // Validar campos obligatorios básicos
    if (!name || !number || !address) {
      return res.status(400).json({ 
        message: 'Los campos name, number y address son obligatorios.' 
      });
    }

    // Verificar si ya existe otra institución con el mismo nombre o número (excluyendo la actual)
    const existingInstitution = await Institution.findOne({
      $and: [
        { _id: { $ne: id } },
        { $or: [{ name }, { number }] }
      ]
    });

    if (existingInstitution) {
      const field = existingInstitution.name === name ? 'nombre' : 'número';
      return res.status(400).json({ 
        message: `Ya existe otra institución registrada con ese ${field}.` 
      });
    }

    const updatedInstitution = await Institution.findByIdAndUpdate(
      id,
      { name, number, address, phoneNumber, director, secretary, grades, logoUrl },
      { new: true, runValidators: true } // runValidators asegura que el esquema valide los datos al actualizar
    );

    if (!updatedInstitution) {
      return res.status(404).json({ message: 'Institución no encontrada.' });
    }

    return res.status(200).json(updatedInstitution);

  } catch (error) {
    console.error('Error al actualizar institución:', error);

    // Error de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Por favor, corrige los siguientes errores:', 
        errors: errorMessages, 
        details: error.errors 
      });
    }

    // Error por índice único duplicado en MongoDB (Código 11000)
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      const duplicatedValue = error.keyValue[duplicatedField];
      return res.status(400).json({ 
        message: `El valor '${duplicatedValue}' para el campo '${duplicatedField}' ya está en uso.` 
      });
    }

    return res.status(500).json({ message: 'Hubo un error interno al actualizar la institución.' });
  }
};

// Obtener todas las instituciones
exports.getAllInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find();
    return res.status(200).json(institutions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Hubo un error al obtener las instituciones.' });
  }
};

// Obtener una institución por ID
exports.getInstitutionById = async (req, res) => {
  try {
    const { id } = req.params;
    const institution = await Institution.findById(id);

    if (!institution) {
      return res.status(404).json({ message: 'Institución no encontrada.' });
    }

    return res.status(200).json(institution);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Hubo un error al obtener la institución.' });
  }
};

// Eliminar una institución por ID
exports.deleteInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInstitution = await Institution.findByIdAndDelete(id);

    if (!deletedInstitution) {
      return res.status(404).json({ message: 'Institución no encontrada.' });
    }

    return res.status(200).json({ message: 'Institución eliminada con éxito.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Hubo un error al eliminar la institución.' });
  }
};