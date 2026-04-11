const mongoose = require('mongoose');

// Importamos todos tus modelos
const DisciplineReport = require('../models/DisciplineReport');
const Institution = require('../models/institutionModel');
const Notification = require('../models/Notification');
const Planificacion = require('../models/planficacion');
const Student = require('../models/Student');
const StudentTask = require('../models/StudentTask');
const Task = require('../models/Task');
const User = require('../models/User');

const syncData = async () => {
  let atlasConn;
  try {
    // Intentamos abrir una conexión temporal a Atlas
    // Usamos createConnection para no interferir con la conexión local principal
    atlasConn = await mongoose.createConnection(process.env.MONGODB_URI).asPromise();
    
    console.log("📡 [Sync] Conexión con Atlas establecida. Buscando datos locales pendientes...");

    const modelos = [
      { name: 'DisciplineReport', model: DisciplineReport },
      { name: 'Institution', model: Institution },
      { name: 'Notification', model: Notification },
      { name: 'Planificacion', model: Planificacion },
      { name: 'Student', model: Student },
      { name: 'StudentTask', model: StudentTask },
      { name: 'Task', model: Task },
      { name: 'User', model: User }
    ];

    for (const m of modelos) {
      // Buscamos solo lo que NO está sincronizado
      const pendientes = await m.model.find({ sincronizado: false }).lean();
      
      if (pendientes.length > 0) {
        console.log(`📤 [Sync] Subiendo ${pendientes.length} registros de ${m.name}...`);
        
        const AtlasModel = atlasConn.model(m.name, m.model.schema);

        for (const doc of pendientes) {
          try {
            // Quitamos el flag de sincronizado para que en la nube no se guarde como 'false'
            const docToUpload = { ...doc, sincronizado: true, lastModified: new Date() };
            
            // Usamos findByIdAndUpdate con upsert: true para que si no existe lo cree, y si existe lo actualice
            await AtlasModel.findByIdAndUpdate(doc._id, docToUpload, { upsert: true });

            // Si se subió con éxito, lo marcamos como sincronizado en la DB Local
            await m.model.findByIdAndUpdate(doc._id, { 
              sincronizado: true, 
              lastModified: new Date() 
            });
          } catch (err) {
            console.error(`❌ Error al sincronizar documento ${doc._id} de ${m.name}:`, err.message);
          }
        }
      }
    }
    
    console.log("✅ [Sync] Sincronización finalizada con éxito.");
  } catch (error) {
    console.log("☁️ [Sync] Atlas no disponible o sin internet. Los datos se mantienen en local.");
  } finally {
    if (atlasConn) await atlasConn.close();
  }
};

module.exports = syncData;