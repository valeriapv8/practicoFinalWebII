const sequelize = require('../db/database');
const User = require('./User');
const Event = require('./Event');
const Inscripcion = require('./Inscripcion');

User.hasMany(Event, { foreignKey: 'organizadorId', as: 'events' });
Event.belongsTo(User, { foreignKey: 'organizadorId', as: 'organizador' });

User.hasMany(Inscripcion, { foreignKey: 'userId', as: 'inscripciones' });
Inscripcion.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Event.hasMany(Inscripcion, { foreignKey: 'eventId', as: 'inscripciones' });
Inscripcion.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

const models = {
  User,
  Event,
  Inscripcion,
  sequelize
};

const syncDatabase = async (force = false) => {
  try {
    await sequelize.authenticate();

    if (force) {
      await sequelize.sync({ force: true });
    } else {
      await sequelize.sync();

      try {
        await sequelize.query(`
          ALTER TABLE inscripciones 
          ADD COLUMN estado VARCHAR(255) DEFAULT 'disponible'
        `);
      } catch (error) {

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

