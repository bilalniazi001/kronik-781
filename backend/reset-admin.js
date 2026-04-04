const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdmin() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🔍 Resetting Admin Password...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const [result] = await connection.query(
            'UPDATE admins SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@kronik.com']
        );

        if (result.affectedRows > 0) {
            console.log('✅ Admin password reset successfully to: admin123');
        } else {
            console.log('❌ Admin account not found in admins table!');
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

resetAdmin();
