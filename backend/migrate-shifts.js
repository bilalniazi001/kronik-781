const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    let connection;
    try {
        console.log('🚀 Connecting to database: ' + process.env.DB_NAME);
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Connected. Adding missing columns...');

        // Function to add column if it doesn't exist
        const addColumn = async (table, definition) => {
            try {
                await connection.query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
                console.log(`✅ Added to ${table}: ${definition}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column in ${table} already exists.`);
                } else {
                    console.error(`❌ Error adding to ${table}:`, err.message);
                }
            }
        };

        // 1. Add shift_type to users table
        await addColumn('users', "shift_type ENUM('morning', 'night') DEFAULT 'morning'");

        // 2. Add shift_type and is_late to attendance table
        await addColumn('attendance', "shift_type ENUM('morning', 'night') DEFAULT 'morning'");
        await addColumn('attendance', "is_late TINYINT(1) DEFAULT 0");

        // 3. Ensure existing users have 'morning' as default
        await connection.query("UPDATE users SET shift_type = 'morning' WHERE shift_type IS NULL");
        console.log('✅ Existing users updated to default Morning Shift.');

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration Global Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
