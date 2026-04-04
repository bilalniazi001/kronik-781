const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkEnums() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🔍 Checking Role Enums...');
        const [rows] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('role', 'role_type') 
            AND TABLE_SCHEMA = ?`, [process.env.DB_NAME]);
        
        console.table(rows);
        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkEnums();
