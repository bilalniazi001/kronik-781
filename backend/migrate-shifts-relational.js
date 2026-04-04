const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function migrateRelationalShifts() {
    let connection;
    try {
        console.log('🚀 Connecting to database: ' + process.env.DB_NAME);
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected. Creating shifts table...');

        // 1. Create shifts table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS shifts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✅ shifts table created.');

        // 2. Add shift_id to users
        try {
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN shift_id INT DEFAULT NULL,
                ADD CONSTRAINT fk_user_shift FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
            `);
            console.log('✅ shift_id column and FK added to users.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ shift_id column already exists in users.');
            } else {
                console.error('❌ Error adding shift_id to users:', err.message);
            }
        }

        // 3. Insert default shifts if empty
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM shifts');
        if (rows[0].count === 0) {
            await connection.query(`
                INSERT INTO shifts (name, start_time, end_time) VALUES 
                ('General Shift', '09:00:00', '18:00:00'),
                ('Night Shift', '20:00:00', '05:00:00')
            `);
            console.log('✅ Default shifts inserted.');
        }

        console.log('🎉 Relational Shifts Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrateRelationalShifts();
