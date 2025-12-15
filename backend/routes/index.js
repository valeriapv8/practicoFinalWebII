const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const eventRoutes = require('./eventRoutes');
const inscripcionRoutes = require('./inscripcionRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/inscripciones', inscripcionRoutes);

module.exports = router;

