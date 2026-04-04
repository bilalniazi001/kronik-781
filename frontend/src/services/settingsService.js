import api from './api'

const settingsService = {
    getSettings: async () => {
        try {
            const response = await api.get('/settings')
            return response.data
        } catch (error) {
            throw error.response?.data || error.message
        }
    },

    getSetting: async (key) => {
        try {
            const response = await api.get(`/settings/${key}`)
            return response.data
        } catch (error) {
            throw error.response?.data || error.message
        }
    },

    updateSetting: async (key, value) => {
        try {
            const response = await api.post('/settings/update', { key, value })
            return response.data
        } catch (error) {
            throw error.response?.data || error.message
        }
    },

    // Simplified helpers for Weekly Holidays
    getWeeklyHolidays: async () => {
        return api.get('/settings/weekly_holidays');
    },

    updateWeeklyHolidays: async (holidays) => {
        return api.post('/settings/update', { key: 'weekly_holidays', value: holidays });
    }
}

export default settingsService
