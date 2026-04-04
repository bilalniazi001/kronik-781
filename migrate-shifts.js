require('dotenv').config({ path: './backend/.env' });
const { pool } = require('./backend/config/database');

async function migrate() {
    try {
        console.log('Starting migration...');

        // 1. Add shift_type to users table
        console.log('Adding shift_type to users...');
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS shift_type ENUM('morning', 'night') DEFAULT 'morning'
        `);

        // 2. Add shift_type and is_late to attendance table
        console.log('Updating attendance table columns...');
        await pool.query(`
            ALTER TABLE attendance 
            ADD COLUMN IF NOT EXISTS shift_type ENUM('morning', 'night') DEFAULT 'morning',
            ADD COLUMN IF NOT EXISTS is_late TINYINT(1) DEFAULT 0
        `);

        // 3. Ensure settings table exists and has weekly_holidays (should be there but safe to check)
        console.log('Ensuring settings table structure...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                setting_key VARCHAR(50) PRIMARY KEY,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
