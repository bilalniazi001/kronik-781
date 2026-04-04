import api from './api';

const breakService = {
  applyBreak: async (breakData) => {
    try {
      const response = await api.post('/breaks/apply', breakData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getMyRequests: async () => {
    try {
      const response = await api.get('/breaks/my-requests');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPending: async () => {
    try {
      const response = await api.get('/breaks/pending');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  action: async (id, status) => {
    try {
      const response = await api.post(`/breaks/action/${id}`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default breakService;
