const express = require('express');
const router = express.Router();
const inscripcionController = require('../controllers/inscripcionController');
const { isAuthenticated, isOrganizador, isValidador } = require('../middleware/authMiddleware');

router.post('/', isAuthenticated, inscripcionController.createInscripcion);
router.get('/my-inscripciones', isAuthenticated, inscripcionController.getMyInscripciones);
router.get('/:id', isAuthenticated, inscripcionController.getInscripcionById);
router.delete('/:id', isAuthenticated, inscripcionController.cancelInscripcion);
router.put('/:id/payment-proof', isAuthenticated, inscripcionController.uploadPaymentProof);

router.get('/event/:eventId', isAuthenticated, isOrganizador, inscripcionController.getEventInscripciones);
router.put('/:id/validate-payment', isAuthenticated, isOrganizador, inscripcionController.validatePayment);

router.post('/validate-entry', isAuthenticated, isValidador, inscripcionController.validateEntry);

module.exports = router;

