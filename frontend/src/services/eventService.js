import api from './api';

export const eventService = {
  getPublicEvents: async () => {
    try {
      const response = await api.get('/events/public');
      return response.data;
    } catch (error) {
      console.error('Error in getPublicEvents:', error);
      throw error;
    }
  },

  getEventById: async (id) => {
    const response = await api.get(`/events/public/${id}`);
    return response.data;
  },

  getMyEvents: async () => {
    const response = await api.get('/events/my-events');
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  getEventStats: async (id) => {
    const response = await api.get(`/events/${id}/stats`);
    return response.data;
  }
};

