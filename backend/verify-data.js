const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyData() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('🔍 Checking Database Accounts Status...');

        // 1. Get total counts by role
        const [rows] = await connection.query('SELECT count(*) as total, role_type FROM users GROUP BY role_type');
        console.table(rows);

        // 2. Specifically check for admin
        const [admin] = await connection.query('SELECT name, email, role_type FROM users WHERE email = "admin@kronik.com"');
        if (admin.length > 0) {
            console.log('✅ Admin Account Found:', admin[0].email);
            console.log('✅ Admin Role:', admin[0].role_type);
        } else {
            console.log('❌ Admin Account Not Found!');
        }

        // 3. Check for any managers/employees to ensure migration didn't delete them
        const [others] = await connection.query('SELECT count(*) as count FROM users WHERE role_type IN ("employee", "manager", "hr")');
        console.log(`✅ Other Accounts (HR/Managers/Employees): ${others[0].count}`);

        await connection.end();
    } catch (error) {
        console.error('❌ Verification Error:', error.message);
    }
}

verifyData();
