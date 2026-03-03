const Institution = require('../models/institutionModel');  // Asegúrate de que la ruta sea correcta según tu estructura de carpetas

// Crear una nueva institución
exports.createInstitution = async (req, res) => {
  try {
    // Log de los datos recibidos
    console.log('Datos recibidos desde el frontend:', req.body);

    const { name, number, address, phoneNumber, director, secretary, grades, logoUrl } = req.body;

    // Validar campos obligatorios
    if (!name || !number || !address) {
      return res.status(400).json({ message: 'Por favor, completa los campos obligatorios: name, number y address.' });
    }

    // Verificar duplicados
    const existingInstitution = await Institution.findOne({ $or: [{ name }, { number }] });
    if (existingInstitution) {
      return res.status(400).json({ message: 'Ya existe una institución con ese nombre o número.' });
    }

    const institution = new Institution({ name, number, address, phoneNumber, director, secretary, grades: grades || [], logoUrl });
    await institution.save();
    res.status(201).json(institution);

  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Datos inválidos.', details: error.errors });
    }
    res.status(500).json({ message: 'Hubo un error al crear la institución.' });
  }
};

// Actualizar una institución por ID
exports.updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    // Log de los datos recibidos
    console.log('Datos recibidos desde el frontend:', req.body);

    const { name, number, address, phoneNumber, director, secretary, grades, logoUrl } = req.body;

    // Validar campos obligatorios
    if (!name || !number || !address) {
      return res.status(400).json({ message: 'Los campos name, number y address son obligatorios.' });
    }

    // Verificar si ya existe una institución con el mismo número (excluyendo la actual)
    const existingInstitution = await Institution.findOne({ number, _id: { $ne: id } });
    if (existingInstitution) {
      return res.status(400).json({ message: 'Ya existe una institución con ese número.' });
    }

    const updatedInstitution = await Institution.findByIdAndUpdate(
      id,
      { name, number, address, phoneNumber, director, secretary, grades, logoUrl },
      { new: true, runValidators: true }
    );

    if (!updatedInstitution) {
      return res.status(404).json({ message: 'Institución no encontrada.' });
    }

    res.status(200).json(updatedInstitution);

  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Datos inválidos.', details: error.errors });
    }
    res.status(500).json({ message: 'Hubo un error al actualizar la institución.' });
  }
};

// Obtener todas las instituciones
exports.getAllInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find();
    res.status(200).json(institutions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hubo un error al obtener las instituciones.' });
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

    res.status(200).json(institution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hubo un error al obtener la institución.' });
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

    res.status(200).json({ message: 'Institución eliminada con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Hubo un error al eliminar la institución.' });
  }
};
