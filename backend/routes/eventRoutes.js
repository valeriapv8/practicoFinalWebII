const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { isAuthenticated, isOrganizador } = require('../middleware/authMiddleware');

// Rutas públicas (visitantes)
router.get('/public', eventController.getPublicEvents);
router.get('/public/:id', eventController.getEventById);

// Rutas protegidas para organizadores
router.get('/my-events', isAuthenticated, isOrganizador, eventController.getMyEvents);
router.post('/', isAuthenticated, isOrganizador, eventController.createEvent);
router.put('/:id', isAuthenticated, isOrganizador, eventController.updateEvent);
router.delete('/:id', isAuthenticated, isOrganizador, eventController.deleteEvent);
router.get('/:id/stats', isAuthenticated, isOrganizador, eventController.getEventStats);

module.exports = router;

