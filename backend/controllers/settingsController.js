const { pool } = require('../config/database');

class SettingsController {
    // Get all settings
    static async getSettings(req, res, next) {
        try {
            const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
            const settings = {};
            rows.forEach(row => {
                try {
                    settings[row.setting_key] = JSON.parse(row.setting_value);
                } catch (e) {
                    settings[row.setting_key] = row.setting_value;
                }
            });
            res.json({ success: true, data: settings });
        } catch (error) {
            next(error);
        }
    }

    // Get specific setting
    static async getSetting(req, res, next) {
        try {
            const { key } = req.params;
            const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Setting not found' });
            }
            let value = rows[0].setting_value;
            try { value = JSON.parse(value); } catch (e) {}
            res.json({ success: true, key, value });
        } catch (error) {
            next(error);
        }
    }

    // Update or Create setting
    static async updateSetting(req, res, next) {
        try {
            const { key, value } = req.body;
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

            await pool.query(
                `INSERT INTO settings (setting_key, setting_value) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE setting_value = ?`,
                [key, stringValue, stringValue]
            );

            res.json({ success: true, message: `Setting '${key}' updated successfully` });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = SettingsController;
