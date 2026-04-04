const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function migrateExtraHours() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🚀 Migrating Attendance table for Phase 7...');

        // 1. Check if extra_hours column exists
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'attendance' 
            AND COLUMN_NAME = 'extra_hours' 
            AND TABLE_SCHEMA = ?`, [process.env.DB_NAME]);

        if (columns.length === 0) {
            console.log('Adding extra_hours column...');
            await connection.query(`ALTER TABLE attendance ADD COLUMN extra_hours VARCHAR(10) DEFAULT "00:00"`);
            console.log('✅ Column added.');
        } else {
            console.log('✅ Column already exists.');
        }

        await connection.end();
        console.log('🎉 Phase 7 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration Error:', error.message);
    }
}

migrateExtraHours();
