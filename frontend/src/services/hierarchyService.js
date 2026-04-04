import api from './api';

const hierarchyService = {
  getOrganizationTree: async () => {
    try {
      const response = await api.get('/hierarchy/tree');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default hierarchyService;
