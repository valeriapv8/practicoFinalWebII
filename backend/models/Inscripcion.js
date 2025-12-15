const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');
const crypto = require('crypto');

const Inscripcion = sequelize.define('Inscripcion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  paymentStatus: {
    type: DataTypes.ENUM('pendiente', 'pagado', 'rechazado'),
    allowNull: false,
    defaultValue: 'pendiente'
  },
  paymentProof: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: true, // Opcional para compatibilidad con migración
    defaultValue: 'disponible',
    validate: {
      isIn: [['disponible', 'usado', 'gastado']]
    }
  },
  hasEntered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  entryDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'inscripciones',
  timestamps: true,
  hooks: {
    beforeCreate: async (inscripcion) => {
      // Generar token único si no existe o es null
      if (!inscripcion.token || inscripcion.token === null || inscripcion.token === undefined) {
        inscripcion.token = crypto.randomBytes(32).toString('hex');
      }
      // Generar código único si no existe (formato: EVT-XXXXXX)
      if (!inscripcion.codigo || inscripcion.codigo === null || inscripcion.codigo === undefined) {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        inscripcion.codigo = `EVT-${randomCode}`;
      }
      // Establecer estado por defecto si no existe
      if (!inscripcion.estado || inscripcion.estado === null || inscripcion.estado === undefined) {
        inscripcion.estado = 'disponible';
      }
    },
    afterFind: async (inscripciones) => {
      // Asegurar que todas las inscripciones tengan estado
      if (Array.isArray(inscripciones)) {
        inscripciones.forEach(inscripcion => {
          if (!inscripcion.estado) {
            inscripcion.estado = 'disponible';
          }
        });
      } else if (inscripciones && !inscripciones.estado) {
        inscripciones.estado = 'disponible';
      }
    }
  }
});

module.exports = Inscripcion;

