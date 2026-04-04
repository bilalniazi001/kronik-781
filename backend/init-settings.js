const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function initSettings() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🚀 Initializing Settings...');

        // 1. Ensure settings table exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT NOT NULL AUTO_INCREMENT,
                setting_key VARCHAR(100) NOT NULL,
                setting_value TEXT,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY key_UNIQUE (setting_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Insert default weekly_holidays if missing (Default: Sunday)
        const [rows] = await connection.query('SELECT * FROM settings WHERE setting_key = "weekly_holidays"');
        if (rows.length === 0) {
            await connection.query('INSERT INTO settings (setting_key, setting_value) VALUES ("weekly_holidays", ?)', [JSON.stringify(['Sunday'])]);
            console.log('✅ Weekly holidays initialized to Sunday.');
        } else {
            console.log('✅ Weekly holidays already exist:', rows[0].setting_value);
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Init Error:', error.message);
    }
}

initSettings();
