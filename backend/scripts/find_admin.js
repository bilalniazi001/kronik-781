const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdmins() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Checking "users" table for admin roles...');
        const [users] = await connection.execute('SELECT id, name, email, role, role_type FROM users WHERE role = "admin" OR role_type = "admin"');
        console.log(JSON.stringify(users, null, 2));

        console.log('\nChecking "admins" table...');
        try {
            const [admins] = await connection.execute('SELECT id, name, email, role FROM admins');
            console.log(JSON.stringify(admins, null, 2));
        } catch (e) {
            console.log('Admins table might not exist or error: ' + e.message);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkAdmins();
