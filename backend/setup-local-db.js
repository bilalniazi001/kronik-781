const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    const connectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    console.log('🚀 Starting Database Setup...');
    console.log(`Connecting to MySQL as ${connectionConfig.user}...`);

    let connection;
    try {
        connection = await mysql.createConnection(connectionConfig);
        
        console.log(`Creating database "${process.env.DB_NAME}"...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await connection.query(`USE ${process.env.DB_NAME}`);

        console.log('Reading schema file...');
        // Try both possible filenames
        let schemaPath = path.join(__dirname, 'complete_database_schema.sql');
        if (!fs.existsSync(schemaPath)) {
            schemaPath = path.join(__dirname, 'onesta_complete_schema.sql');
        }
        
        if (!fs.existsSync(schemaPath)) {
            throw new Error('Schema file not found in backend directory!');
        }

        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema (this may take a few seconds)...');
        await connection.query(sql);

        console.log('✅ Database setup successfully!');
        console.log('You can now run "npm start" or "npm run dev" to start the server.');

    } catch (error) {
        console.error('❌ Error during setup:');
        console.error(error.message);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Hint: Check your DB_PASSWORD in the .env file.');
        }
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();
