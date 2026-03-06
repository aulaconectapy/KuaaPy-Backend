// seed/seedStudentsWithUsers.js
const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('../models/Student');
const User = require('../models/User');

// Conexión a DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log(`MongoDB conectado: ${mongoose.connection.host}`))
  .catch(err => {
    console.error(`Error al conectar a MongoDB: ${err.message}`);
    process.exit(1);
  });

// Lista de estudiantes 3° grado con contraseña
const studentsData = [
  {firstName:"MARIA BELEN", lastName:"BENITEZ IBAÑEZ", cedula:"8442486", birthDate:new Date("2018-03-07"), password:"A1b2C3"},
  {firstName:"JOSE MIGUEL", lastName:"CABALLERO LUDWIG", cedula:"8301456", birthDate:new Date("2017-09-05"), password:"B4c5D6"},
  {firstName:"JOSUE", lastName:"CABALLERO MICHELON", cedula:"6280457", birthDate:new Date("2017-01-03"), password:"C7d8E9"},
  {firstName:"LUCERO VALENTINA", lastName:"CACERES ZARACHO", cedula:"8326483", birthDate:new Date("2017-04-10"), password:"D1e2F3"},
  {firstName:"DYLAN EMANUEL", lastName:"CANDIA VON HEIMBURG", cedula:"8326533", birthDate:new Date("2017-04-17"), password:"E4f5G6"},
  {firstName:"JEFFERSON NAHUEL", lastName:"CARMONA PRIETO", cedula:"8291698", birthDate:new Date("2017-04-18"), password:"F7g8H9"},
  {firstName:"MARIA MONSERRATH", lastName:"CASTRO ACOSTA", cedula:"9087513", birthDate:new Date("2018-01-30"), password:"G1h2I3"},
  {firstName:"BASTIAN MATIAS", lastName:"CHAMORRO SOSA", cedula:"9075113", birthDate:new Date("2018-02-23"), password:"H4i5J6"},
  {firstName:"PIERO ALESSANDRO", lastName:"DICK GOMEZ", cedula:"8418876", birthDate:new Date("2017-11-11"), password:"I7j8K9"},
  {firstName:"MAIA ANAI", lastName:"DUARTE ORTIZ", cedula:"8379065", birthDate:new Date("2017-07-12"), password:"J1k2L3"},
  {firstName:"RUBEN", lastName:"GENES ORZUSA", cedula:"8629804", birthDate:new Date("2017-12-22"), password:"K4l5M6"},
  {firstName:"THIAGO ALEXANDRO", lastName:"KAFER NUÑEZ", cedula:"8449489", birthDate:new Date("2017-11-10"), password:"L7m8N9"},
  {firstName:"ARON VALENTINO", lastName:"LOPEZ JARA", cedula:"8326678", birthDate:new Date("2017-11-16"), password:"M1n2O3"},
  {firstName:"SANTIAGO", lastName:"MACIEL SANABRIA", cedula:"8459250", birthDate:new Date("2017-06-26"), password:"N4o5P6"},
  {firstName:"SANTINO GAEL", lastName:"MELGAREJO IBAÑEZ", cedula:"8331317", birthDate:new Date("2017-07-13"), password:"Q7r8S9"},
  {firstName:"ELIAS NICOLAS", lastName:"RIOS FLORES", cedula:"8896988", birthDate:new Date("2017-11-30"), password:"T1u2V3"},
  {firstName:"THIAGO MANUEL", lastName:"ROJAS PAIVA", cedula:"8247657", birthDate:new Date("2017-07-14"), password:"W4x5Y6"},
  {firstName:"ALEJO NAHUEL", lastName:"ROZAS AQUINO", cedula:"8487333", birthDate:new Date("2017-08-27"), password:"Z7a8B9"},
  {firstName:"CLAUDIO NICOLAS", lastName:"SELENT CENTURION", cedula:"8604366", birthDate:new Date("2018-03-20"), password:"C1d2E3"},
  {firstName:"BIANCA ELIZABETH", lastName:"SPIES SANABRIA", cedula:"8375625", birthDate:new Date("2018-02-08"), password:"F4g5H6"},
  {firstName:"HECTOR EMANUEL", lastName:"VELAZQUEZ BOGADO", cedula:"8441193", birthDate:new Date("2018-02-17"), password:"I7j8K9"},
  {firstName:"LEILA MAGALI", lastName:"VERA KITNER", cedula:"8379049", birthDate:new Date("2017-07-04"), password:"L1m2N3"},
  {firstName:"VALENTINA", lastName:"ZARATE CHAVEZ", cedula:"57013926", birthDate:new Date("2018-05-08"), password:"O4p5Q6"}
];

async function seed() {
  try {
    // Borra estudiantes y usuarios existentes
    const cedulas = studentsData.map(s => s.cedula);
    await Student.deleteMany({ cedula: { $in: cedulas } });
    await User.deleteMany({ username: { $in: cedulas } });

    for (let s of studentsData) {
      // Crear usuario
      const user = await User.create({
        username: s.cedula,
        password: s.password,
        role: 'estudiante',
        createdBy: "69a5d22327f8b2e6f727e23e"
      });

      // Crear estudiante asociado al usuario
      await Student.create({
        firstName: s.firstName,
        lastName: s.lastName,
        cedula: s.cedula,
        birthDate: s.birthDate,
        institution: "678a99c9f066183f3a1d4e08",
        grade: "3° grado",
        guardian: "s/d",
        user: user._id,
        createdBy: "69a5d22327f8b2e6f727e23e"
      });
    }

    console.log("Usuarios y estudiantes creados con éxito");
  } catch (err) {
    console.error("Error al crear usuarios/estudiantes:", err);
  } finally {
    mongoose.disconnect();
  }
}

seed();