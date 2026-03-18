const Planificacion = require('../models/planficacion');

// 🔹 Crear una nueva planificación (Solo Docentes)
exports.createPlanificacion = async (req, res) => {
  try {
    const nuevaPlanificacion = new Planificacion({
      ...req.body,
      profesor: req.user.id, // ID del token JWT
      institucion: req.user.institution,
      estado: 'Borrador'
    });
    await nuevaPlanificacion.save();
    res.status(201).json(nuevaPlanificacion);
  } catch (error) {
    res.status(400).json({ message: "Error al crear", error: error.message });
  }
};

// 🔹 Ver mis planificaciones (Docente ve las suyas, Director ve todas las de su institución)
exports.getPlanificaciones = async (req, res) => {
  try {
    let query = {};
    const role = req.user.role.toLowerCase();

    if (role === 'docente') {
      query.profesor = req.user.id;
    } else if (['director/a', 'secretario/a', 'secretaria'].includes(role)) {
      query.institucion = req.user.institution;
      // Los directivos normalmente solo ven las enviadas o aprobadas, 
      // pero aquí permitimos ver todas las de su escuela:
    }

    const planificaciones = await Planificacion.find(query)
      .populate('profesor', 'firstName lastName')
      .sort({ fechaInicio: -1 });
      
    res.json(planificaciones);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener datos", error });
  }
};

// 🔹 Ver una planificación específica
exports.getPlanificacionById = async (req, res) => {
  try {
    const plan = await Planificacion.findById(req.params.id)
      .populate('profesor', 'firstName lastName');
    if (!plan) return res.status(404).json({ message: "No encontrada" });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Error", error });
  }
};

// 🔹 Editar/Actualizar (Solo si es Borrador y es el dueño)
exports.updatePlanificacion = async (req, res) => {
  try {
    const plan = await Planificacion.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "No encontrada" });

    // Seguridad: Solo el dueño puede editar y solo si no está aprobada
    if (plan.profesor.toString() !== req.user.id) {
      return res.status(403).json({ message: "No tienes permiso" });
    }
    
    if (plan.estado === 'Aprobado') {
      return res.status(400).json({ message: "No se puede editar una planificación ya aprobada" });
    }

    const actualizado = await Planificacion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar", error });
  }
};

// 🔹 Eliminar
exports.deletePlanificacion = async (req, res) => {
  try {
    const plan = await Planificacion.findById(req.params.id);
    if (plan.profesor.toString() !== req.user.id) return res.status(403).json({ message: "No permitido" });
    
    await Planificacion.findByIdAndDelete(req.params.id);
    res.json({ message: "Eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error", error });
  }
};

// 🔹 Cambiar Estado (Enviar para Revisión o Aprobar)
exports.updateStatus = async (req, res) => {
  try {
    const { estado, observacionesGenerales } = req.body;
    const plan = await Planificacion.findById(req.params.id);
    const role = req.user.role.toLowerCase();

    // Lógica Docente: Solo puede pasar de Borrador a Enviado
    if (estado === 'Enviado') {
      if (plan.profesor.toString() !== req.user.id) return res.status(403).json({ message: "No eres el autor" });
      plan.estado = 'Enviado';
    } 
    
    // Lógica Directivo: Puede Aprobar o Rechazar
    else if (['Aprobado', 'Rechazado'].includes(estado)) {
      if (!['director/a', 'secretario/a', 'secretaria', 'administrador'].includes(role)) {
        return res.status(403).json({ message: "No tienes rango para aprobar" });
      }
      plan.estado = estado;
      if (observacionesGenerales) plan.observacionesGenerales = observacionesGenerales;
    }

    await plan.save();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar estado", error });
  }
};