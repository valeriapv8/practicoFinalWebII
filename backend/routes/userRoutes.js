const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.post('/register', userController.createUser);

router.get('/', isAuthenticated, isAdmin, userController.getAllUsers);
router.get('/:id', isAuthenticated, isAdmin, userController.getUserById);
router.post('/', isAuthenticated, isAdmin, userController.createUser);
router.put('/:id', isAuthenticated, isAdmin, userController.updateUser);
router.put('/:id/password', isAuthenticated, isAdmin, userController.changePassword);
router.delete('/:id', isAuthenticated, isAdmin, userController.deleteUser);

module.exports = router;

