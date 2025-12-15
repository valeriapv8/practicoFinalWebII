const { Event, Inscripcion, User } = require('../models');
const { Op } = require('sequelize');

const getPublicEvents = async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.findAll({
      where: {
        isActive: true,
        date: {
          [Op.gte]: now
        }
      },
      include: [
        {
          model: User,
          as: 'organizador',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Inscripcion,
          as: 'inscripciones',
          attributes: ['id', 'paymentStatus']
        }
      ],
      order: [['date', 'ASC']]
    });

    const eventsWithCount = events.map(event => {
      const eventData = event.toJSON();
      eventData.inscripcionesCount = eventData.inscripciones.filter(i => i.paymentStatus === 'pagado').length;
      delete eventData.inscripciones;
      return eventData;
    });

    res.json({ success: true, data: eventsWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id, {
      include: [{
        model: User,
        as: 'organizador',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      where: {
        organizadorId: req.user.id
      },
      include: [{
        model: Inscripcion,
        as: 'inscripciones',
        attributes: ['id', 'paymentStatus']
      }],
      order: [['date', 'DESC']]
    });

    const eventsWithCount = events.map(event => {
      const eventData = event.toJSON();
      eventData.inscripcionesCount = eventData.inscripciones.filter(i => i.paymentStatus === 'pagado').length;
      delete eventData.inscripciones;
      return eventData;
    });

    res.json({ success: true, data: eventsWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      location,
      latitude,
      longitude,
      poster,
      maxCapacity,
      price
    } = req.body;

    if (!title || !description || !date || !location) {
      return res.status(400).json({
        success: false,
        message: 'Título, descripción, fecha y ubicación son requeridos'
      });
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      latitude: latitude || null,
      longitude: longitude || null,
      poster: poster || null,
      maxCapacity: maxCapacity || 100,
      price: price || 0,
      organizadorId: req.user.id,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: event
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    if (event.organizadorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este evento'
      });
    }

    const {
      title,
      description,
      date,
      location,
      latitude,
      longitude,
      poster,
      maxCapacity,
      price,
      isActive
    } = req.body;

    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (location) event.location = location;
    if (latitude !== undefined) event.latitude = latitude;
    if (longitude !== undefined) event.longitude = longitude;
    if (poster !== undefined) event.poster = poster;
    if (maxCapacity) event.maxCapacity = maxCapacity;
    if (price !== undefined) event.price = price;
    if (isActive !== undefined) event.isActive = isActive;

    await event.save();

    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: event
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    if (event.organizadorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este evento'
      });
    }

    await event.destroy();

    res.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEventStats = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id, {
      include: [{
        model: Inscripcion,
        as: 'inscripciones'
      }]
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    if (event.organizadorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las estadísticas de este evento'
      });
    }

    const inscripciones = event.inscripciones || [];
    const totalInscritos = inscripciones.length;
    const asistentesConfirmados = inscripciones.filter(i => i.hasEntered).length;
    const cuposLibres = event.maxCapacity - totalInscritos;

    res.json({
      success: true,
      data: {
        event: {
          id: event.id,
          title: event.title,
          maxCapacity: event.maxCapacity
        },
        totalInscritos,
        asistentesConfirmados,
        cuposLibres,
        inscripcionesPorEstado: {
          pendiente: inscripciones.filter(i => i.paymentStatus === 'pendiente').length,
          pagado: inscripciones.filter(i => i.paymentStatus === 'pagado').length,
          rechazado: inscripciones.filter(i => i.paymentStatus === 'rechazado').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPublicEvents,
  getEventById,
  getMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats
};

