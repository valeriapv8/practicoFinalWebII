const createAdmin = require('./createAdmin');
const { syncDatabase } = require('../models');

const initializeDatabase = async () => {
  try {
    // Sincronizar base de datos (solo crea tablas si no existen, no borra datos)
    await syncDatabase(false);
    
    // Crear administrador inicial
    await createAdmin();
  } catch (error) {
    process.exit(1);
  }
};

module.exports = initializeDatabase;

