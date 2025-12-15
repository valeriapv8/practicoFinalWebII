const sequelize = require('../db/database');
const User = require('./User');
const Event = require('./Event');
const Inscripcion = require('./Inscripcion');

// Definir relaciones
User.hasMany(Event, { foreignKey: 'organizadorId', as: 'events' });
Event.belongsTo(User, { foreignKey: 'organizadorId', as: 'organizador' });

User.hasMany(Inscripcion, { foreignKey: 'userId', as: 'inscripciones' });
Inscripcion.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Event.hasMany(Inscripcion, { foreignKey: 'eventId', as: 'inscripciones' });
Inscripcion.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

// Inicializar modelos
const models = {
  User,
  Event,
  Inscripcion,
  sequelize
};

// Sincronizar modelos con la base de datos
const syncDatabase = async (force = false) => {
  try {
    await sequelize.authenticate();
    
    // Si force es true, borra y recrea todo (solo para desarrollo inicial)
    // Si force es false, solo crea las tablas si no existen (no borra datos)
    if (force) {
      await sequelize.sync({ force: true });
    } else {
      // Usar sync() sin opciones para solo crear tablas si no existen
      await sequelize.sync();
      
      // Intentar agregar columna 'estado' si no existe (migración manual)
      try {
        await sequelize.query(`
          ALTER TABLE inscripciones 
          ADD COLUMN estado VARCHAR(255) DEFAULT 'disponible'
        `);
      } catch (error) {
        // Si la columna ya existe, ignorar el error
        // No hacer nada si la columna ya existe
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
    throw error;
  }
};

module.exports = {
  ...models,
  syncDatabase
};

