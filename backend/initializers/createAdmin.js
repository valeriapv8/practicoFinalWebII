const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Verificar si ya existe un administrador
    const existingAdmin = await User.findOne({
      where: { role: 'administrador' }
    });

    if (existingAdmin) {
      return existingAdmin;
    }

    // Crear administrador inicial
    const admin = await User.create({
      email: process.env.ADMIN_EMAIL || 'admin@admin.com',
      name: process.env.ADMIN_NAME || 'Administrador',
      password: process.env.ADMIN_PASSWORD || 'Admin123!',
      role: 'administrador',
      isActive: true
    });

    return admin;
  } catch (error) {
    throw error;
  }
};

module.exports = createAdmin;

