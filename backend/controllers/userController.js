const User = require('../models/User');
const { Op } = require('sequelize');

// Obtener todos los usuarios (solo administradores)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener un usuario por ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Crear un nuevo usuario (registro público o por administrador)
const createUser = async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    // Validaciones básicas
    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, nombre y contraseña son requeridos'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Si viene desde el frontend (registro público), solo puede crear participantes
    // Si viene desde un administrador, puede asignar cualquier rol
    const userRole = req.user && req.user.role === 'administrador' 
      ? (role || 'participante') 
      : 'participante';

    const user = await User.create({
      email,
      name,
      password,
      role: userRole,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Actualizar un usuario (solo administradores)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Actualizar campos permitidos
    if (email) user.email = email;
    if (name) user.name = name;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cambiar contraseña de un usuario (solo administradores)
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Eliminar un usuario (solo administradores)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser
};

