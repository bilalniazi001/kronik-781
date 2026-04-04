const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await connection.query('UPDATE admins SET password = ? WHERE email = ?', [
            hashedPassword, 
            'admin@kronik.com'
        ]);

        console.log('✅ Password successfully reset to admin123 for admin@kronik.com');
        await connection.end();
    } catch (e) {
        console.error('❌ Error resetting password:', e.message);
    }
}

resetPassword();
