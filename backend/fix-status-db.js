const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixStatusColumn() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Add 'rejected_by_manager' and 'cancelled' to the ENUM
        const query = `
            ALTER TABLE leave_applications 
            MODIFY COLUMN status ENUM(
                'pending_manager', 
                'approved_by_manager', 
                'pending_hr', 
                'approved', 
                'rejected', 
                'rejected_by_manager', 
                'cancelled'
            ) DEFAULT 'pending_manager'
        `;

        await connection.query(query);
        console.log('✅ Database status column updated successfully');
        await connection.end();
    } catch (error) {
        console.error('❌ Error fixing status column:', error.message);
    }
}

fixStatusColumn();
