const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar autenticación
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );

    // Buscar usuario
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido o inactivo'
      });
    }

    // Agregar usuario al request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

// Middleware para verificar rol específico
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

// Middleware para verificar rol de administrador
const isAdmin = hasRole('administrador');

// Middleware para verificar rol de organizador
const isOrganizador = hasRole('organizador');

// Middleware para verificar rol de validador
const isValidador = hasRole('validador');

// Middleware para verificar rol de participante
const isParticipante = hasRole('participante');

module.exports = {
  isAuthenticated,
  hasRole,
  isAdmin,
  isOrganizador,
  isValidador,
  isParticipante
};
