const Planificacion = require('../models/planficacion');

// 🔹 Crear una nueva planificación (Solo Docentes)
exports.createPlanificacion = async (req, res) => {
  try {
    console.log("--- PROCESANDO GUARDADO ---");
    
    const profesorId = req.user.userId || req.user.id || req.user._id;
    const institucionId = req.user.institution;

    console.log("ID del Profesor extraído:", profesorId);

    // Generar las fechas para cada día basándonos en la fecha de inicio
    const fechaBase = new Date(req.body.fechaInicio);
    const diasProcesados = (req.body.dias || []).map((dia, index) => {
      const fechaDia = new Date(fechaBase);
      fechaDia.setDate(fechaDia.getDate() + index); // Suma días de la semana
      return {
        ...dia,
        fecha: fechaDia
      };
    });

    const nuevaPlanificacion = new Planificacion({
      ...req.body,
      profesor: profesorId,      
      institucion: institucionId,
      dias: diasProcesados,       
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
    if (!plan) return res.status(404).json({ message: "No encontrada" });
    
    const currentUserId = req.user.userId || req.user.id || req.user._id;
    if (plan.profesor.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "No permitido" });
    }
    
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
    
    const currentUserId = req.user.userId || req.user.id || req.user._id;

    if (role === 'docente') {
      query.profesor = currentUserId; 
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

    if (plan.profesor.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "No tienes permiso" });
    }
    
    if (plan.estado === 'Aprobado') {
      return res.status(400).json({ message: "No se puede editar una ya aprobada" });
    }

    // Procesar fechas de los días si se actualizaron
    let diasActualizados = plan.dias;
    if (req.body.fechaInicio && req.body.dias) {
      const fechaBase = new Date(req.body.fechaInicio);
      diasActualizados = req.body.dias.map((dia, index) => {
        const fechaDia = new Date(fechaBase);
        fechaDia.setDate(fechaDia.getDate() + index);
        return {
          ...dia,
          fecha: fechaDia
        };
      });
    }

    const actualizado = await Planificacion.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, dias: diasActualizados }, 
      { new: true, runValidators: true }
    );
    
    res.json(actualizado);
  } catch (error) {
    console.error("❌ ERROR AL ACTUALIZAR:", error.message);
    res.status(400).json({ message: "Error al actualizar", details: error.message });
  }
};

// 🔹 Cambiar Estado
exports.updateStatus = async (req, res) => {
  try {
    const { estado, observacionesGenerales } = req.body;
    const currentUserId = req.user.userId || req.user.id || req.user._id;
    const plan = await Planificacion.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "No encontrada" });

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