const fs = require('fs');

let code = fs.readFileSync('models/AttendanceModel.js', 'utf8');
const repl = `    // Calculate Logical Shift Dates
    static getLogicalShift(shiftStartTime) {
        const now = require('moment-timezone')().tz('Asia/Karachi');
        let shiftCycleStart = require('moment-timezone').tz(\`\${now.format('YYYY-MM-DD')} \${shiftStartTime}\`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Karachi');

        if (now.isBefore(shiftCycleStart)) {
            shiftCycleStart.subtract(1, 'days');
        }

        return {
            logicalDate: shiftCycleStart.format('YYYY-MM-DD'),
            currentTime: now.format('HH:mm:ss'),
            nowMoment: now,
            shiftStartMoment: shiftCycleStart
        };
    }

    // Check in
    static async checkIn(userId, checkInData) {
        const { latitude, longitude, location_name } = checkInData;
        
        const [userRows] = await pool.query(\`
            SELECT u.shift_id, s.start_time 
            FROM users u 
            LEFT JOIN shifts s ON u.shift_id = s.id 
            WHERE u.id = ?\`, [userId]);
        
        const shiftStart = userRows[0]?.start_time || '09:00:00';
        
        const { logicalDate, currentTime, nowMoment, shiftStartMoment } = this.getLogicalShift(shiftStart);

        if (nowMoment.isBefore(shiftStartMoment)) {
            throw new Error('Too early to check in for this shift cycle.');
        }

        const [existing] = await pool.query(
            \`SELECT id FROM attendance WHERE user_id = ? AND date = ?\`,
            [userId, logicalDate]
        );

        if (existing.length > 0) {
            throw new Error('Already checked in');
        }

        let isLate = 0;
        const diffMinutes = nowMoment.diff(shiftStartMoment, 'minutes');
        if (diffMinutes > 0) {
            isLate = 1;
        }

        const location = location_name || \`\${latitude},\${longitude}\`;

        const [result] = await pool.query(
            \`INSERT INTO attendance 
            (user_id, date, check_in_time, check_in_location, check_in_latitude, check_in_longitude, status, shift_id, is_late)
            VALUES (?, ?, ?, ?, ?, ?, 'checked_in', ?, ?)\`,
            [userId, logicalDate, currentTime, location, latitude, longitude, userRows[0]?.shift_id || null, isLate]
        );

        return {
            id: result.insertId,
            date: logicalDate,
            check_in_time: currentTime,
            location
        };
    }

    // Check out
    static async checkOut(userId, checkOutData) {
        const { latitude, longitude, location_name } = checkOutData;
        const now = require('moment-timezone')().tz('Asia/Karachi');
        const currentTime = now.format('HH:mm:ss');

        const [attendance] = await pool.query(
            \`SELECT * FROM attendance 
             WHERE user_id = ? AND status = 'checked_in'
             ORDER BY id DESC LIMIT 1\`,
            [userId]
        );

        if (attendance.length === 0) {
            throw new Error('No active check-in record found');
        }

        const record = attendance[0];

        const checkInMoment = require('moment-timezone').tz(\`\${record.date} \${record.check_in_time}\`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Karachi');
        const duration = require('moment-timezone').duration(now.diff(checkInMoment));
        let totalMinutes = Math.floor(duration.asMinutes());
        
        let hoursWorkedStr = "00:00";
        let extraHoursStr = "00:00";

        if (totalMinutes > 9 * 60) {
            hoursWorkedStr = "09:00";
            const extraMins = totalMinutes - (9 * 60);
            extraHoursStr = \`\${String(Math.floor(extraMins / 60)).padStart(2, '0')}:\${String(extraMins % 60).padStart(2, '0')}\`;
        } else {
            hoursWorkedStr = \`\${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:\${String(totalMinutes % 60).padStart(2, '0')}\`;
            extraHoursStr = "00:00";
        }

        const location = location_name || \`\${latitude},\${longitude}\`;

        await pool.query(
            \`UPDATE attendance 
             SET check_out_time = ?,
                 check_out_location = ?,
                 check_out_latitude = ?,
                 check_out_longitude = ?,
                 hours_worked = ?,
                 extra_hours = ?,
                 status = 'completed'
             WHERE id = ?\`,
            [currentTime, location, latitude, longitude, hoursWorkedStr, extraHoursStr, record.id]
        );

        return {
            id: record.id,
            date: record.date,
            check_in_time: record.check_in_time,
            check_out_time: currentTime,
            hours_worked: hoursWorkedStr,
            extra_hours: extraHoursStr,
            location
        };
    }

    static async reconcileStaleAttendance(userId) {
        const now = require('moment-timezone')().tz('Asia/Karachi');
        const [rows] = await pool.query(
            \`SELECT id, date, check_in_time FROM attendance 
             WHERE user_id = ? AND status = 'checked_in'\`,
            [userId]
        );

        for (const record of rows) {
            const checkInMoment = require('moment-timezone').tz(\`\${record.date} \${record.check_in_time}\`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Karachi');
            const durationHours = require('moment-timezone').duration(now.diff(checkInMoment)).asHours();

            if (durationHours > 15) {
                await pool.query(
                    \`UPDATE attendance 
                     SET hours_worked = '09:00', extra_hours = '00:00',
                         status = 'incomplete' 
                     WHERE id = ?\`,
                    [record.id]
                );
            }
        }
    }

    static async getTodayStatus(userId) {
        await this.reconcileStaleAttendance(userId);
        
        const [userRows] = await pool.query(\`
            SELECT s.start_time 
            FROM users u 
            LEFT JOIN shifts s ON u.shift_id = s.id 
            WHERE u.id = ?\`, [userId]);
            
        const shiftStartTime = userRows[0]?.start_time || '09:00:00';
        
        const { logicalDate } = this.getLogicalShift(shiftStartTime);
        
        const [records] = await pool.query(
            \`SELECT * FROM attendance WHERE user_id = ? AND date = ? ORDER BY id DESC LIMIT 1\`,
            [userId, logicalDate]
        );
        
        if (records.length === 0) {
            return { checked_in: false, checked_out: false };
        }
        
        const record = records[0];
        if (['completed', 'incomplete', 'leave', 'absent'].includes(record.status)) {
            return {
                id: record.id,
                checked_in: !!record.check_in_time,
                checked_out: !!record.check_out_time,
                status: record.status,
                hours_worked: record.hours_worked
            };
        }
        
        return {
            id: record.id,
            checked_in: true,
            checked_out: false,
            check_in_time: record.check_in_time,
            status: record.status
        };
    }`;

let newCode = code.replace(/    \/\/ Check in[\s\S]*?    \/\/ Get user attendance history with gap filling for absents\/leaves/, repl + '\n\n    // Get user attendance history with gap filling for absents/leaves');

if (newCode === code) {
  console.log('NO CHANGE!');
} else {
  fs.writeFileSync('models/AttendanceModel.js', newCode);
  console.log('File successfully updated!');
}
