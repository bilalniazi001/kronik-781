const { pool } = require('./config/database');
require('dotenv').config({ path: './.env' });

async function fixLeaveSchema() {
    try {
        console.log('Starting schema fix...');

        // 1. Add ceo_comments if not exists
        try {
            await pool.query(`ALTER TABLE leave_applications ADD COLUMN ceo_comments TEXT AFTER hr_comments`);
            console.log('Added ceo_comments column.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ceo_comments already exists.');
            } else {
                throw e;
            }
        }

        // 2. Update status enum
        // Since MySQL/MariaDB ALTER TABLE on ENUM can be tricky depending on version, 
        // we'll use a more standard approach if possible, or just force it if we know the target.
        // For TiDB/MySQL 8.0:
        await pool.query(`
            ALTER TABLE leave_applications 
            MODIFY COLUMN status ENUM(
                'pending_manager', 
                'pending_gm',
                'approved_by_manager', 
                'pending_hr', 
                'pending_ceo',
                'approved', 
                'rejected_by_manager', 
                'rejected',
                'cancelled'
            ) DEFAULT 'pending_manager'
        `);
        console.log('Updated status enum.');

        // 3. Update current_approver enum
        await pool.query(`
            ALTER TABLE leave_applications 
            MODIFY COLUMN current_approver ENUM('manager', 'hr', 'ceo') DEFAULT 'manager'
        `);
        console.log('Updated current_approver enum.');

        console.log('Schema fix completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing schema:', error);
        process.exit(1);
    }
}

fixLeaveSchema();
