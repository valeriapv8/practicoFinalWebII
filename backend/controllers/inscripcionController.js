const { Inscripcion, Event, User } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Inscribirse a un evento
const createInscripcion = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'ID del evento es requerido'
      });
    }

    // Verificar que el evento existe
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Verificar que el evento no haya pasado
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes inscribirte a un evento que ya pasó'
      });
    }

    // Verificar que no esté ya inscrito
    const existingInscripcion = await Inscripcion.findOne({
      where: {
        userId: req.user.id,
        eventId: eventId
      }
    });

    if (existingInscripcion) {
      return res.status(400).json({
        success: false,
        message: 'Ya estás inscrito a este evento'
      });
    }

    // Verificar capacidad - solo contar inscripciones aceptadas
    const inscripcionesCount = await Inscripcion.count({
      where: {
        eventId: eventId,
        paymentStatus: 'pagado'
      }
    });

    if (inscripcionesCount >= event.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'El evento ha alcanzado su capacidad máxima'
      });
    }

    // Generar token y código únicos
    const token = crypto.randomBytes(32).toString('hex');
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codigo = `EVT-${randomCode}`;

    // Crear inscripción
    // Si el evento tiene precio, el estado de pago es pendiente hasta que se valide el comprobante
    // Si es gratuito, se marca como pagado automáticamente
    const inscripcion = await Inscripcion.create({
      userId: req.user.id,
      eventId: eventId,
      token: token,
      codigo: codigo,
      paymentStatus: event.price > 0 ? 'pendiente' : 'pagado',
      estado: 'disponible' // Estado inicial: disponible para usar
    });

    // Cargar relaciones
    await inscripcion.reload({
      include: [
        { model: Event, as: 'event' },
        { model: User, as: 'user' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Inscripción realizada exitosamente',
      data: inscripcion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Obtener mis inscripciones
const getMyInscripciones = async (req, res) => {
  try {
    const inscripciones = await Inscripcion.findAll({
      where: {
        userId: req.user.id
      },
      include: [{
        model: Event,
        as: 'event',
        include: [{
          model: User,
          as: 'organizador',
          attributes: ['id', 'name']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    // Asegurar que todas las inscripciones tengan estado
    inscripciones.forEach(inscripcion => {
      if (!inscripcion.estado) {
        inscripcion.estado = 'disponible';
      }
    });

    res.json({ success: true, data: inscripciones });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Obtener inscripción por ID (con token para QR)
const getInscripcionById = async (req, res) => {
  try {
    const { id } = req.params;
    const inscripcion = await Inscripcion.findByPk(id, {
      include: [{
        model: Event,
        as: 'event'
      }]
    });

    if (!inscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Inscripción no encontrada'
      });
    }

    // Verificar que pertenece al usuario
    if (inscripcion.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta inscripción'
      });
    }

    res.json({ success: true, data: inscripcion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancelar inscripción
const cancelInscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    const inscripcion = await Inscripcion.findByPk(id, {
      include: [{
        model: Event,
        as: 'event'
      }]
    });

    if (!inscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Inscripción no encontrada'
      });
    }

    // Verificar que pertenece al usuario
    if (inscripcion.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cancelar esta inscripción'
      });
    }

    // Verificar que el evento no haya pasado
    if (new Date(inscripcion.event.date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'No puedes cancelar una inscripción a un evento que ya pasó'
      });
    }

    // Verificar que no haya pagado o que el pago no haya sido aceptado
    if (inscripcion.paymentStatus === 'pagado') {
      return res.status(400).json({
        success: false,
        message: 'No puedes cancelar una inscripción con pago confirmado'
      });
    }

    await inscripcion.destroy();

    res.json({
      success: true,
      message: 'Inscripción cancelada exitosamente'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Subir comprobante de pago
const uploadPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentProof } = req.body;

    if (!paymentProof) {
      return res.status(400).json({
        success: false,
        message: 'Comprobante de pago es requerido'
      });
    }

    const inscripcion = await Inscripcion.findByPk(id);

    if (!inscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Inscripción no encontrada'
      });
    }

    // Verificar que pertenece al usuario
    if (inscripcion.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar esta inscripción'
      });
    }

    inscripcion.paymentProof = paymentProof;
    inscripcion.paymentStatus = 'pendiente';
    await inscripcion.save();

    res.json({
      success: true,
      message: 'Comprobante de pago subido exitosamente',
      data: inscripcion
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validar entrada por token (solo validador)
const validateEntry = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token es requerido'
      });
    }

    const inscripcion = await Inscripcion.findOne({
      where: { token },
      include: [{
        model: Event,
        as: 'event'
      }, {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!inscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Token inválido',
        data: { valid: false, status: 'invalid' }
      });
    }

    // Verificar que el evento sea el del día
    const eventDate = new Date(inscripcion.event.date);
    const today = new Date();
    if (eventDate.toDateString() !== today.toDateString()) {
      return res.status(400).json({
        success: false,
        message: 'Este evento no es hoy',
        data: { valid: false, status: 'wrong_date' }
      });
    }

    // Verificar estado de pago - debe estar pagado para poder usar la entrada
    if (inscripcion.paymentStatus !== 'pagado') {
      return res.json({
        success: true,
        message: 'Inscripción encontrada pero el pago no está confirmado',
        data: {
          valid: false,
          status: 'payment_pending',
          inscripcion: {
            user: inscripcion.user,
            paymentStatus: inscripcion.paymentStatus
          }
        }
      });
    }

    // Verificar si la entrada ya fue usada
    if (inscripcion.estado === 'usado' || inscripcion.estado === 'gastado') {
      return res.json({
        success: true,
        message: 'Esta entrada ya fue usada',
        data: {
          valid: false,
          status: 'already_used',
          inscripcion: {
            user: inscripcion.user,
            estado: inscripcion.estado,
            entryDate: inscripcion.entryDate
          }
        }
      });
    }

    // Marcar entrada como usada y registrar ingreso
    inscripcion.estado = 'usado';
    inscripcion.hasEntered = true;
    inscripcion.entryDate = new Date();
    await inscripcion.save();

    res.json({
      success: true,
      message: 'Ingreso validado exitosamente',
      data: {
        valid: true,
        status: 'valid',
        inscripcion: {
          user: inscripcion.user,
          entryDate: inscripcion.entryDate
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener inscripciones de un evento (solo organizador)
const getEventInscripciones = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Verificar que el evento pertenece al organizador
    if (event.organizadorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las inscripciones de este evento'
      });
    }

    const inscripciones = await Inscripcion.findAll({
      where: { eventId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: inscripciones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validar/rechazar comprobante de pago (solo organizador)
const validatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' o 'reject'

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Acción inválida. Debe ser "accept" o "reject"'
      });
    }

    const inscripcion = await Inscripcion.findByPk(id, {
      include: [{
        model: Event,
        as: 'event'
      }]
    });

    if (!inscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Inscripción no encontrada'
      });
    }

    // Verificar que el evento pertenece al organizador
    if (inscripcion.event.organizadorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para validar esta inscripción'
      });
    }

    inscripcion.paymentStatus = action === 'accept' ? 'pagado' : 'rechazado';
    // Si se acepta el pago, asegurar que el estado esté en 'disponible' para poder usar la entrada
    if (action === 'accept' && inscripcion.estado !== 'usado' && inscripcion.estado !== 'gastado') {
      inscripcion.estado = 'disponible';
    }
    await inscripcion.save();

    res.json({
      success: true,
      message: `Pago ${action === 'accept' ? 'aceptado' : 'rechazado'} exitosamente`,
      data: inscripcion
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createInscripcion,
  getMyInscripciones,
  getInscripcionById,
  cancelInscripcion,
  uploadPaymentProof,
  validateEntry,
  getEventInscripciones,
  validatePayment
};

