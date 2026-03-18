const Planificacion = require('../models/planficacion');

// 🔹 Crear una nueva planificación (Solo Docentes)
exports.createPlanificacion = async (req, res) => {
  try {
    console.log("--- PROCESANDO GUARDADO ---");
    
    // 1. Extraer el ID correctamente según tu token decodificado (userId)
    const profesorId = req.user.userId || req.user.id || req.user._id;
    const institucionId = req.user.institution;

    console.log("ID del Profesor extraído:", profesorId);

    // 2. Generar las fechas para cada día basándonos en la fecha de inicio
    // Esto soluciona el error "Campo: dias.X.fecha | Mensaje: Path fecha is required"
    const fechaBase = new Date(req.body.fechaInicio);
    const diasProcesados = req.body.dias.map((dia, index) => {
      const fechaDia = new Date(fechaBase);
      fechaDia.setDate(fechaDia.getDate() + index); // Suma 0 para lunes, 1 para martes, etc.
      return {
        ...dia,
        fecha: fechaDia
      };
    });

    // 3. Crear la instancia con los datos mapeados
    const nuevaPlanificacion = new Planificacion({
      ...req.body,
      profesor: profesorId,      // Ahora sí tendrá valor
      institucion: institucionId,
      dias: diasProcesados,       // Ahora los días tienen su Date obligatorio
      estado: 'Borrador'
    });

    await nuevaPlanificacion.save();
    
    console.log("✅ Planificación guardada correctamente");
    res.status(201).json(nuevaPlanificacion);

  } catch (error) {
    console.error("❌ ERROR AL CREAR:", error.message);
    res.status(400).json({ 
      message: "Error de validación", 
      details: error.message 
    });
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

// 🔹 Ver mis planificaciones (Docente ve las suyas, Director ve todas las de su institución)
exports.getPlanificaciones = async (req, res) => {
  try {
    let query = {};
    const role = req.user.role.toLowerCase();
    
    // USAR EL ID CORRECTO DEL TOKEN (userId)
    const currentUserId = req.user.userId || req.user.id || req.user._id;

    if (role === 'docente') {
      query.profesor = currentUserId; // <-- CORREGIDO
    } else if (['director/a', 'secretario/a', 'secretaria', 'administrador'].includes(role)) {
      query.institucion = req.user.institution;
    }

    const planificaciones = await Planificacion.find(query)
      .populate('profesor', 'firstName lastName')
      .sort({ fechaInicio: -1 });
      
    res.json(planificaciones);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener datos", error });
  }
};

// 🔹 Editar/Actualizar
exports.updatePlanificacion = async (req, res) => {
  try {
    const currentUserId = req.user.userId || req.user.id || req.user._id;
    const plan = await Planificacion.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "No encontrada" });

    // Seguridad: Comparar con el ID correcto
    if (plan.profesor.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "No tienes permiso" });
    }
    
    if (plan.estado === 'Aprobado') {
      return res.status(400).json({ message: "No se puede editar una ya aprobada" });
    }

    const actualizado = await Planificacion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar", error });
  }
};

// 🔹 Cambiar Estado
exports.updateStatus = async (req, res) => {
  try {
    const { estado, observacionesGenerales } = req.body;
    const currentUserId = req.user.userId || req.user.id || req.user._id;
    const plan = await Planificacion.findById(req.params.id);
    const role = req.user.role.toLowerCase();

    if (estado === 'Enviado') {
      if (plan.profesor.toString() !== currentUserId.toString()) {
        return res.status(403).json({ message: "No eres el autor" });
      }
      plan.estado = 'Enviado';
    } 
    else if (['Aprobado', 'Rechazado'].includes(estado)) {
      if (!['director/a', 'secretario/a', 'secretaria', 'administrador'].includes(role)) {
        return res.status(403).json({ message: "No tienes rango" });
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