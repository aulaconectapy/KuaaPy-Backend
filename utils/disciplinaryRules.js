const BehaviorReport = require('../models/BehaviorReport');

module.exports = async (studentId) => {
  const reports = await BehaviorReport.find({
    student: studentId,
    behaviorType: 'Negativo',
  });

  const leves = reports.filter(r => r.faultType === 'Leve').length;
  const graves = reports.filter(r => r.faultType === 'Grave').length;
  const muyGraves = reports.filter(r => r.faultType === 'Muy grave').length;

  if (muyGraves >= 1) return 'Derivación a Dirección';
  if (graves >= 2) return 'Citación a Padres';
  if (leves >= 3) return 'Advertencia';

  return null;
};