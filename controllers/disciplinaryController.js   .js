const DisciplinaryRecord = require('../models/DisciplinaryRecord');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const applyRules = require('../utils/disciplinaryRules');

exports.createDisciplinaryRecord = async (req, res) => {
  try {
    const { studentId, faultType, description } = req.body;

    // 1. Verificar alumno
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }

    // 2. Crear registro disciplinario
    const record = await DisciplinaryRecord.create({
      student: studentId,
      faultType,            // leve | grave | muy grave
      description,
      createdBy: req.user._id,
      viewedByParent: false,
      date: new Date()
    });

    // 3. 👉 APLICAR REGLAS DISCIPLINARIAS (AQUÍ VA TU CÓDIGO)
    const action = await applyRules(student._id);

    if (action) {
      await Notification.create({
        user: student.parent, // notificar al padre
        title: 'Acción disciplinaria',
        message: `El estudiante requiere: ${action}`,
      });
    }

    res.status(201).json({
      message: 'Falta registrada correctamente',
      record,
      actionApplied: action || null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};