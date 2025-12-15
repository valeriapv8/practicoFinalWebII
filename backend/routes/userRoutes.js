const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Ruta pública: registro de usuarios (solo crea participantes)
router.post('/register', userController.createUser);

// Rutas protegidas: solo administradores pueden acceder
router.get('/', isAuthenticated, isAdmin, userController.getAllUsers);
router.get('/:id', isAuthenticated, isAdmin, userController.getUserById);
router.post('/', isAuthenticated, isAdmin, userController.createUser); // Admin puede crear usuarios con cualquier rol
router.put('/:id', isAuthenticated, isAdmin, userController.updateUser);
router.put('/:id/password', isAuthenticated, isAdmin, userController.changePassword);
router.delete('/:id', isAuthenticated, isAdmin, userController.deleteUser);

module.exports = router;

