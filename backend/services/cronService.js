const cron = require('node-cron');
const AttendanceModel = require('../models/AttendanceModel');

const initCronJobs = () => {
    // Run at 12:01 AM every day (Asia/Karachi time if server is set so, otherwise UTC)
    // 1 0 * * *
    cron.schedule('1 0 * * *', async () => {
        console.log('Running daily absent marking job...');
        try {
            const result = await AttendanceModel.markAbsent();
            console.log('Daily absent marking result:', result.message);
        } catch (error) {
            console.error('Daily cron job failed:', error);
        }
    });

    // 2. Auto Check-out (Every 30 minutes)
    cron.schedule('*/30 * * * *', async () => {
        console.log('Running auto-checkout job...');
        try {
            const result = await AttendanceModel.autoCheckoutSessions();
            console.log(`Auto-checkout completed. Updated: ${result.updatedCount}`);
        } catch (error) {
            console.error('Auto-checkout cron job failed:', error);
        }
    });

    console.log('Cron jobs initialized.');
};

module.exports = { initCronJobs };
