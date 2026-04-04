const { pool } = require('../config/database');
const CacheManager = require('../utils/cacheManager');

class SettingsModel {
    /**
     * Get a setting value by key
     * @param {string} key 
     * @returns {Promise<any>}
     */
    static async get(key) {
        // Try to get from cache first
        const cachedValue = CacheManager.get(key);
        if (cachedValue !== undefined) {
            return cachedValue;
        }

        const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
        if (rows.length === 0) return null;
        
        let value = rows[0].setting_value;
        let parsedValue;
        try {
            parsedValue = JSON.parse(value);
        } catch (e) {
            parsedValue = value;
        }

        // Save to cache
        CacheManager.set(key, parsedValue);
        return parsedValue;
    }

    /**
     * Get weekly holidays as a Set of day names
     * @returns {Promise<Set<string>>}
     */
    static async getWeeklyHolidays() {
        // We will cache the finalized Set Object
        const CACHE_KEY = 'weekly_holidays_set';
        const cachedSet = CacheManager.get(CACHE_KEY);
        if (cachedSet !== undefined) {
            return cachedSet;
        }

        const holidays = await this.get('weekly_holidays');
        const holidaySet = new Set(Array.isArray(holidays) ? holidays : ['Sunday']);
        
        // Save to cache
        CacheManager.set(CACHE_KEY, holidaySet);
        return holidaySet;
    }

    /**
     * Set a setting value
     * @param {string} key 
     * @param {any} value 
     */
    static async set(key, value) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await pool.query(
            `INSERT INTO settings (setting_key, setting_value) 
             VALUES (?, ?) 
             ON DUPLICATE KEY UPDATE setting_value = ?`,
            [key, stringValue, stringValue]
        );
        
        // Clear cache for this key
        CacheManager.invalidate(key);
        if (key === 'weekly_holidays') {
            CacheManager.invalidate('weekly_holidays_set');
        }
    }
}

module.exports = SettingsModel;
