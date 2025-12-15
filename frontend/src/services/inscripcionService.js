import api from './api';

export const inscripcionService = {
  createInscripcion: async (eventId) => {
    const response = await api.post('/inscripciones', { eventId });
    return response.data;
  },

  getMyInscripciones: async () => {
    const response = await api.get('/inscripciones/my-inscripciones');
    return response.data;
  },

  getInscripcionById: async (id) => {
    const response = await api.get(`/inscripciones/${id}`);
    return response.data;
  },

  cancelInscripcion: async (id) => {
    const response = await api.delete(`/inscripciones/${id}`);
    return response.data;
  },

  getEventInscripciones: async (eventId) => {
    const response = await api.get(`/inscripciones/event/${eventId}`);
    return response.data;
  },

  validatePayment: async (id, action) => {
    const response = await api.put(`/inscripciones/${id}/validate-payment`, { action });
    return response.data;
  },

  validateEntry: async (token) => {
    const response = await api.post('/inscripciones/validate-entry', { token });
    return response.data;
  },

  deleteInscripcion: async (id) => {
    const response = await api.delete(`/inscripciones/${id}`);
    return response.data;
  }
};

