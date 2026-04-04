import api from './api';

const API_URL = '/admin/shifts';

const shiftService = {
    getAllShifts: async () => {
        try {
            const response = await api.get(API_URL);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    createShift: async (shiftData) => {
        try {
            const response = await api.post(API_URL, shiftData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    updateShift: async (id, shiftData) => {
        try {
            const response = await api.put(`${API_URL}/${id}`, shiftData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    deleteShift: async (id) => {
        try {
            const response = await api.delete(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },
    assignShift: async (userId, shiftId) => {
        try {
            const response = await api.post(`${API_URL}/assign`, { userId, shiftId });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default shiftService;
