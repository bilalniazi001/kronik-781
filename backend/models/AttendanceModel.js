const { pool } = require('../config/database');
const moment = require('moment-timezone');
const SettingsModel = require('./SettingsModel');

class AttendanceModel {
    // Helper to sanitize duration strings
    static sanitizeDuration(duration) {
        if (!duration || typeof duration !== 'string' || duration === 'NaN:NaN') {
            return '00:00';
        }
        return duration;
    }
    // Calculate Logical Shift Dates (with 4-hour early buffer)
    static getLogicalShift(shiftStartTime) {
        const BUFFER_HOURS = 4;
        const moment = require('moment-timezone');
        const now = moment().tz('Asia/Karachi');
        
        // Target shift today
        let shiftStartToday = moment.tz(`${now.format('YYYY-MM-DD')} ${shiftStartTime}`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Karachi');
        
        // Window for "Today" starts at (shiftStartToday - 4 hours)
        let windowStartToday = shiftStartToday.clone().subtract(BUFFER_HOURS, 'hours');
        
        let logicalDate;
        let shiftStartMoment;

        if (now.isSameOrAfter(windowStartToday)) {
            // It's after today's window start, so it belongs to Today's logical date
            logicalDate = now.format('YYYY-MM-DD');
            shiftStartMoment = shiftStartToday;
        } else {
            // It's before today's window start, so it belongs to Yesterday's logical date
            logicalDate = now.clone().subtract(1, 'days').format('YYYY-MM-DD');
            shiftStartMoment = shiftStartToday.clone().subtract(1, 'days');
        }

        return {
            logicalDate,
            currentTime: now.format('HH:mm:ss'),
            nowMoment: now,
            shiftStartMoment
        };
    }

    // Check in
    static async checkIn(userId, checkInData) {
        const { latitude, longitude, location_name } = checkInData;
        
        const [userRows] = await pool.query(`
            SELECT u.shift_id, s.start_time 
            FROM users u 
            LEFT JOIN shifts s ON u.shift_id = s.id 
            WHERE u.id = ?`, [userId]);
        
        const shiftStart = userRows[0]?.start_time || '09:00:00';
        
        const { logicalDate, currentTime, nowMoment, shiftStartMoment } = this.getLogicalShift(shiftStart);

        // checkIn logic now implicitly uses the window from getLogicalShift.
        // No hard "Too early" error needed anymore as the window defines the date.

        // Multi-checkin allowed: Removed existing.length > 0 check

        let isLate = 0;
        const diffMinutes = nowMoment.diff(shiftStartMoment, 'minutes');
        if (diffMinutes > 0) {
            isLate = 1;
        }

        const location = location_name || `${latitude},${longitude}`;

        const [result] = await pool.query(
            `INSERT INTO attendance 
            (user_id, date, check_in_time, check_in_location, check_in_latitude, check_in_longitude, status, shift_id, is_late)
            VALUES (?, ?, ?, ?, ?, ?, 'checked_in', ?, ?)`,
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
        const { latitude, longitude, location_name, break_id } = checkOutData;
        const now = require('moment-timezone')().tz('Asia/Karachi');
        const currentTime = now.format('HH:mm:ss');

        const [attendance] = await pool.query(
            `SELECT * FROM attendance 
             WHERE user_id = ? AND status = 'checked_in'
             ORDER BY id DESC LIMIT 1`,
            [userId]
        );

        if (attendance.length === 0) {
            throw new Error('No active check-in record found');
        }

        const record = attendance[0];

        // 1. Fetch other completed sessions for the same user and logical date
        const [previousSessions] = await pool.query(
            `SELECT hours_worked FROM attendance 
             WHERE user_id = ? AND date = ? AND status = 'completed'`,
            [userId, record.date]
        );

        let previousMinutes = 0;
        previousSessions.forEach(sess => {
            if (sess.hours_worked && sess.hours_worked.includes(':')) {
                const [h, m] = sess.hours_worked.split(':').map(Number);
                previousMinutes += (h * 60 + m);
            }
        });

        const checkInMoment = require('moment-timezone').tz(`${record.date} ${record.check_in_time}`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Karachi');
        
        let currentSessionMinutes = 0;
        if (checkInMoment.isValid()) {
            const duration = require('moment-timezone').duration(now.diff(checkInMoment));
            currentSessionMinutes = Math.max(0, Math.floor(duration.asMinutes()));
        }
        
        const DAILY_QUOTA_MINUTES = 9 * 60; // 540 minutes
        let sessionRegularMinutes = 0;
        let sessionExtraMinutes = 0;

        if (previousMinutes >= DAILY_QUOTA_MINUTES) {
            // All time in this session is extra
            sessionRegularMinutes = 0;
            sessionExtraMinutes = currentSessionMinutes;
        } else {
            const availableQuota = DAILY_QUOTA_MINUTES - previousMinutes;
            sessionRegularMinutes = Math.min(currentSessionMinutes, availableQuota);
            sessionExtraMinutes = Math.max(0, currentSessionMinutes - sessionRegularMinutes);
        }

        const hoursWorkedStr = `${String(Math.floor(sessionRegularMinutes / 60)).padStart(2, '0')}:${String(sessionRegularMinutes % 60).padStart(2, '0')}`;
        const extraHoursStr = `${String(Math.floor(sessionExtraMinutes / 60)).padStart(2, '0')}:${String(sessionExtraMinutes % 60).padStart(2, '0')}`;

        const location = location_name || `${latitude},${longitude}`;

        await pool.query(
            `UPDATE attendance 
             SET check_out_time = ?,
                 check_out_location = ?,
                 check_out_latitude = ?,
                 check_out_longitude = ?,
                 hours_worked = ?,
                 extra_hours = ?,
                 status = 'completed',
                 break_id = ?
             WHERE id = ?`,
            [currentTime, location, latitude, longitude, hoursWorkedStr, extraHoursStr, break_id || null, record.id]
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
            `SELECT id, date, check_in_time FROM attendance 
             WHERE user_id = ? AND status = 'checked_in'`,
            [userId]
        );

        for (const record of rows) {
            const checkInMoment = require('moment-timezone').tz(`${record.date} ${record.check_in_time}`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Karachi');
            const durationHours = require('moment-timezone').duration(now.diff(checkInMoment)).asHours();

            if (durationHours > 15) {
                await pool.query(
                    `UPDATE attendance 
                     SET hours_worked = '09:00', extra_hours = '00:00',
                         status = 'incomplete' 
                     WHERE id = ?`,
                    [record.id]
                );
            }
        }
    }

    static async getTodayStatus(userId) {
        await this.reconcileStaleAttendance(userId);
        
        const [userRows] = await pool.query(`
            SELECT s.start_time 
            FROM users u 
            LEFT JOIN shifts s ON u.shift_id = s.id 
            WHERE u.id = ?`, [userId]);
            
        const shiftStartTime = userRows[0]?.start_time || '09:00:00';
        
        const { logicalDate } = this.getLogicalShift(shiftStartTime);
        
        const [records] = await pool.query(
            `SELECT * FROM attendance WHERE user_id = ? AND date = ? ORDER BY id DESC LIMIT 1`,
            [userId, logicalDate]
        );
        
        if (records.length === 0) {
            return { checked_in: false, checked_out: false };
        }
        
        const record = records[0];
        if (['completed', 'incomplete', 'leave', 'absent'].includes(record.status)) {
            return {
                id: record.id,
                checked_in: false, // Return false to allow new check-in
                checked_out: true,
                status: record.status,
                hours_worked: this.sanitizeDuration(record.hours_worked)
            };
        }
        
        return {
            id: record.id,
            checked_in: true,
            checked_out: false,
            check_in_time: record.check_in_time,
            status: record.status,
            hours_worked: this.sanitizeDuration(record.hours_worked)
        };
    }

    // Get user attendance history with gap filling for absents/leaves
    static async getUserHistory(userId, startDate, endDate, limit = 31, offset = 0) {
        // Reconcile stale records before fetching history
        await this.reconcileStaleAttendance(userId);

        // 1. Get User Creation Date to bound the report
        const [user] = await pool.query('SELECT created_at, joining_date FROM users WHERE id = ?', [userId]);
        if (!user[0]) throw new Error('User not found');
        
        const registrationDate = moment(user[0].joining_date || user[0].created_at).tz('Asia/Karachi').startOf('day');
        const rangeStart = moment(startDate).tz('Asia/Karachi').startOf('day');
        const rangeEnd = moment(endDate).tz('Asia/Karachi').startOf('day');
        
        // Final start date is the later of requested start and registration date
        const actualStart = moment.max(registrationDate, rangeStart);
        
        // 2. Fetch actual attendance records
        const [attendanceRows] = await pool.query(
            `SELECT id, date, check_in_time, check_out_time, 
                    check_in_location, check_out_location,
                    hours_worked, extra_hours, status, is_late, shift_id
             FROM attendance 
             WHERE user_id = ? 
               AND date BETWEEN ? AND ?
             ORDER BY date ASC`,
            [userId, actualStart.format('YYYY-MM-DD'), rangeEnd.format('YYYY-MM-DD')]
        );

        // 3. Fetch approved leaves with type names
        const [leaveRows] = await pool.query(
            `SELECT la.start_date, la.end_date, lt.name as leave_type
             FROM leave_applications la
             JOIN leave_application_details lad ON la.id = lad.application_id
             JOIN leave_types lt ON lad.leave_type_id = lt.id
             WHERE la.employee_id = ? AND la.status = 'approved'
               AND (la.start_date <= ? AND la.end_date >= ?)`,
            [userId, rangeEnd.format('YYYY-MM-DD'), actualStart.format('YYYY-MM-DD')]
        );

        // 4. Fetch public holidays
        const [holidayRows] = await pool.query(
            'SELECT title, holiday_date FROM public_holidays WHERE holiday_date BETWEEN ? AND ?',
            [actualStart.format('YYYY-MM-DD'), rangeEnd.format('YYYY-MM-DD')]
        );

        // 5. Map existing data for quick lookup (Summing hours for multiple records per day)
        const attendanceMap = new Map();
        attendanceRows.forEach(row => {
            const dateStr = moment(row.date).format('YYYY-MM-DD');
            const existing = attendanceMap.get(dateStr);
            
            if (existing) {
                // If record exists, sum the hours safely
                if (row.hours_worked && existing.hours_worked) {
                    const h1 = parseInt(existing.hours_worked.split(':')[0]) || 0;
                    const m1 = parseInt(existing.hours_worked.split(':')[1]) || 0;
                    const h2 = parseInt(row.hours_worked.split(':')[0]) || 0;
                    const m2 = parseInt(row.hours_worked.split(':')[1]) || 0;
                    
                    const totalMins = (h1 * 60 + m1) + (h2 * 60 + m2);
                    existing.hours_worked = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
                }
                // Also sum extra_hours safely
                if (row.extra_hours && existing.extra_hours) {
                    const h1 = parseInt((existing.extra_hours || "00:00").split(':')[0]) || 0;
                    const m1 = parseInt((existing.extra_hours || "00:00").split(':')[1]) || 0;
                    const h2 = parseInt((row.extra_hours || "00:00").split(':')[0]) || 0;
                    const m2 = parseInt((row.extra_hours || "00:00").split(':')[1]) || 0;
                    
                    const totalMins = (h1 * 60 + m1) + (h2 * 60 + m2);
                    existing.extra_hours = `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
                }
                // Latest Checkout take precedence for the day
                if (row.check_out_time && (!existing.check_out_time || row.check_out_time > existing.check_out_time)) {
                    existing.check_out_time = row.check_out_time;
                    existing.check_out_location = row.check_out_location;
                }
                // Latest Status take precedence if it's completed
                if (row.status === 'completed') existing.status = 'completed';
                // If any record for the day is late, the entire day marks as late for the report
                if (row.is_late) existing.is_late = 1;
            } else {
                attendanceMap.set(dateStr, { ...row });
            }
        });

        const holidayMap = new Map();
        holidayRows.forEach(row => {
            const dateStr = moment(row.holiday_date).format('YYYY-MM-DD');
            holidayMap.set(dateStr, row.title);
        });

        // 6. Generate full history for the range
        const fullHistory = [];
        const actualEnd = moment.min(moment().tz('Asia/Karachi').endOf('day'), rangeEnd.endOf('day'));
        let currentDate = moment(actualEnd);
        
        // Fetch weekly holidays from settings ONCE before loop
        const weeklyHolidaysSet = await SettingsModel.getWeeklyHolidays();
        
        while (currentDate.isSameOrAfter(actualStart)) {
            const dateStr = currentDate.format('YYYY-MM-DD');
            const attendanceRecord = attendanceMap.get(dateStr);
            const holidayTitle = holidayMap.get(dateStr);

            if (attendanceRecord && (attendanceRecord.status === 'completed' || attendanceRecord.status === 'checked_in')) {
                // Real attendance takes highest priority
                fullHistory.push(attendanceRecord);
            } else if (leaveRows.some(l => moment(l.start_date).isSameOrBefore(currentDate) && moment(l.end_date).isSameOrAfter(currentDate))) {
                // Approved leave takes second priority
                const leave = leaveRows.find(l => moment(l.start_date).isSameOrBefore(currentDate) && moment(l.end_date).isSameOrAfter(currentDate));
                fullHistory.push({
                    date: dateStr,
                    status: 'leave',
                    leave_type: leave.leave_type,
                    hours_worked: '00:00'
                });
            } else if (holidayTitle) {
                // Public holiday takes third priority
                fullHistory.push({
                    date: dateStr,
                    status: 'holiday',
                    holiday_title: holidayTitle,
                    hours_worked: '00:00'
                });
            } else if (weeklyHolidaysSet.has(currentDate.format('dddd'))) {
                // Weekly holiday takes fourth priority
                fullHistory.push({
                    date: dateStr,
                    status: 'holiday',
                    holiday_title: 'Weekly Holiday',
                    hours_worked: '00:00'
                });
            } else {
                // Default is absent
                fullHistory.push({
                    date: dateStr,
                    status: 'absent',
                    hours_worked: '00:00'
                });
            }
            
            currentDate.subtract(1, 'day');
        }
        return {
            total: fullHistory.length,
            data: fullHistory.slice(offset, offset + limit)
        };
    }

    // Get team attendance history for a manager
    static async getTeamHistory(managerId, startDate, endDate, limit = 50, offset = 0) {
        const [rows] = await pool.query(
            `SELECT a.id, a.date, a.check_in_time, a.check_out_time, 
                    a.check_in_location, a.check_out_location,
                    a.hours_worked, a.status,
                    u.name as employee_name, u.designation
             FROM attendance a
             JOIN users u ON a.user_id = u.id
             WHERE u.manager_id = ? 
               AND a.date BETWEEN ? AND ?
             ORDER BY a.date DESC, u.name ASC
             LIMIT ? OFFSET ?`,
            [managerId, startDate, endDate, parseInt(limit), parseInt(offset)]
        );

        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total 
             FROM attendance a
             JOIN users u ON a.user_id = u.id
             WHERE u.manager_id = ? AND a.date BETWEEN ? AND ?`,
            [managerId, startDate, endDate]
        );

        return {
            data: rows,
            total: countResult[0].total,
            limit,
            offset
        };
    }

    // Get team summary with accurate counts (Present, Absent, Leave)
    static async getTeamSummary(managerId, startDate, endDate, roleType = 'employee') {
        const start = moment(startDate).format('YYYY-MM-DD');
        const end = moment(endDate).format('YYYY-MM-DD');

        // 1. Get all relevant users
        let userQuery = `
            SELECT id, name as employee_name, email, phone, cnic, designation, department, joining_date, created_at 
            FROM users 
            WHERE 1=1
        `;
        const userParams = [];
        if (managerId) {
            userQuery += ` AND manager_id = ?`;
            userParams.push(managerId);
        }
        if (roleType) {
            if (Array.isArray(roleType)) {
                userQuery += ` AND role_type IN (?)`;
            } else {
                userQuery += ` AND role_type = ?`;
            }
            userParams.push(roleType);
        }
        
        const [users] = await pool.query(userQuery, userParams);
        if (users.length === 0) return [];

        const userIds = users.map(u => u.id);

        // 2. Get attendance data
        const [attendance] = await pool.query(
            `SELECT user_id, date, status FROM attendance 
             WHERE user_id IN (?) AND date BETWEEN ? AND ?`,
            [userIds, start, end]
        );

        // 3. Get approved leaves
        const [leaves] = await pool.query(
            `SELECT employee_id, start_date, end_date FROM leave_applications 
             WHERE employee_id IN (?) AND status = 'approved'
               AND (start_date <= ? AND end_date >= ?)`,
            [userIds, end, start]
        );

        // Fetch weekly holidays once before the map
        const holidayNamesSet = await SettingsModel.getWeeklyHolidays();
        const [holidayRows] = await pool.query('SELECT holiday_date FROM public_holidays WHERE holiday_date BETWEEN ? AND ?', [start, end]);
        const holidayMap = new Set(holidayRows.map(h => moment(h.holiday_date).format('YYYY-MM-DD')));

        // 4. Calculate counts for each user
        const summary = users.map(u => {
            const registrationDate = moment(u.joining_date || u.created_at).startOf('day');
            const rangeStart = moment(startDate).startOf('day');
            const rangeEnd = moment(endDate).startOf('day');
            
            // Period to check
            const actualStart = moment.max(registrationDate, rangeStart);
            const actualEnd = moment.min(moment(), rangeEnd); // Don't count future days as absent
            
            if (actualEnd.isBefore(actualStart)) {
                return { ...u, user_id: u.id, total_days: 0, present_days: 0, absent_days: 0, leave_days: 0, incomplete_days: 0 };
            }

            // Exclude public holidays AND dynamic weekly holidays from total working days
            let totalWorkingDays = 0;
            let currentDay = moment(actualStart);

            while (currentDay.isSameOrBefore(actualEnd)) {
                const dateStr = currentDay.format('YYYY-MM-DD');
                const dayName = currentDay.format('dddd');
                if (!holidayMap.has(dateStr) && !holidayNamesSet.has(dayName)) {
                    totalWorkingDays++;
                }
                currentDay.add(1, 'days');
            }
            
            const userAttendance = attendance.filter(a => a.user_id === u.id);
            const userLeaves = leaves.filter(l => l.employee_id === u.id);
            
            let present = 0;
            let incomplete = 0;
            let leaveDays = 0;
            
            // Map to track unique dates with status
            const dateStatusMap = new Map();

            // Fill attendance
            userAttendance.forEach(a => {
                const dateStr = moment(a.date).format('YYYY-MM-DD');
                if (a.status === 'completed') present++;
                else if (a.status === 'checked_in') incomplete++;
                dateStatusMap.set(dateStr, a.status);
            });

            // Fill leaves (only for days not already marked as present/incomplete)
            userLeaves.forEach(l => {
                let current = moment.max(actualStart, moment(l.start_date).tz('Asia/Karachi').startOf('day'));
                let lEnd = moment.min(actualEnd, moment(l.end_date).tz('Asia/Karachi').startOf('day'));
                while (current.isSameOrBefore(lEnd)) {
                    const dateStr = current.format('YYYY-MM-DD');
                    const existingStatus = dateStatusMap.get(dateStr);
                    
                    // Only override if no status or status is 'absent'
                    if (!existingStatus || existingStatus === 'absent') {
                        leaveDays++;
                        // If it was 'absent' (or nothing), it's now 'leave'
                        dateStatusMap.set(dateStr, 'leave');
                    }
                    current.add(1, 'days');
                }
            });

            const absent = totalWorkingDays - present - incomplete - leaveDays;

            return {
                user_id: u.id,
                employee_name: u.employee_name,
                email: u.email,
                phone: u.phone,
                cnic: u.cnic,
                designation: u.designation,
                department: u.department,
                total_days: totalWorkingDays,
                present_days: present,
                incomplete_days: incomplete,
                absent_days: Math.max(0, absent),
                leave_days: leaveDays
            };
        });

        return summary;
    }

    // Get all attendance records (for admin)
    static async getAllAttendance(filters = {}, limit = 10, offset = 0) {
        let query = `
            SELECT a.*, u.name, u.email, u.cnic
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const values = [];

        if (filters.user_id) {
            query += ' AND a.user_id = ?';
            values.push(filters.user_id);
        }

        if (filters.start_date) {
            query += ' AND a.date >= ?';
            values.push(filters.start_date);
        }

        if (filters.end_date) {
            query += ' AND a.date <= ?';
            values.push(filters.end_date);
        }

        if (filters.status) {
            query += ' AND a.status = ?';
            values.push(filters.status);
        }

        query += ' ORDER BY a.date DESC, a.check_in_time DESC LIMIT ? OFFSET ?';
        values.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, values);
        return rows;
    }

    // Get attendance summary for report
    static async getSummaryReport(filters = {}) {
        let query = `
            SELECT 
                u.id as user_id,
                u.name,
                u.email,
                u.cnic,
                COUNT(a.id) as total_days,
                SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN a.status = 'checked_in' THEN 1 ELSE 0 END) as incomplete_days,
                SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SEC_TO_TIME(AVG(TIME_TO_SEC(a.hours_worked))) as avg_hours
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id
            WHERE u.role = 'user'
        `;
        const values = [];

        if (filters.start_date && filters.end_date) {
            query += ' AND a.date BETWEEN ? AND ?';
            values.push(filters.start_date, filters.end_date);
        }

        if (filters.user_id) {
            query += ' AND u.id = ?';
            values.push(filters.user_id);
        }

        query += ' GROUP BY u.id, u.name, u.email, u.cnic';

        const [rows] = await pool.query(query, values);
        return rows;
    }

    // Mark absent for users who didn't check in
    static async markAbsent() {
        try {
            const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
            const dayName = moment().subtract(1, 'days').format('dddd');

            // Skip Dynamic Weekly Holidays (Phase 6)
            const weeklyHolidays = await SettingsModel.getWeeklyHolidays();
            if (weeklyHolidays.has(dayName)) {
                console.log(`Skipping absent marking for ${yesterday} - Weekly Holiday: ${dayName}`);
                return { success: true, message: `Skipping weekly holiday: ${dayName}` };
            }

            // 1. Get all active users with role_type 'user' (exclude admins/hr from auto-absent if desired)
            const [users] = await pool.query("SELECT id FROM users WHERE role_type = 'user'");

            for (const user of users) {
                // 2. Check for public holiday first
                const [holiday] = await pool.query(
                    "SELECT title FROM public_holidays WHERE holiday_date = ?",
                    [yesterday]
                );
                
                if (holiday.length > 0) {
                    console.log(`Skipping absent marking for ${yesterday} - Public Holiday: ${holiday[0].title}`);
                    continue;
                }

                // 3. Check if attendance record exists
                const [attendance] = await pool.query(
                    "SELECT id FROM attendance WHERE user_id = ? AND date = ?",
                    [user.id, yesterday]
                );

                if (attendance.length === 0) {
                    // 3. Check for approved leave
                    const [leaves] = await pool.query(
                        `SELECT la.id, lt.name as leave_type
                         FROM leave_applications la
                         JOIN leave_application_details lad ON la.id = lad.application_id
                         JOIN leave_types lt ON lad.leave_type_id = lt.id
                         WHERE la.employee_id = ? AND la.status = 'approved' 
                         AND ? BETWEEN la.start_date AND la.end_date
                         LIMIT 1`,
                        [user.id, yesterday]
                    );

                    if (leaves.length > 0) {
                        // Mark as Leave
                        await pool.query(
                            `INSERT INTO attendance (user_id, date, status, is_leave_day, leave_application_id, leave_type)
                             VALUES (?, ?, 'leave', 1, ?, ?)`,
                            [user.id, yesterday, leaves[0].id, leaves[0].leave_type]
                        );
                        console.log(`Marked User ${user.id} as Leave for ${yesterday}`);
                    } else {
                        // Mark as Absent
                        await pool.query(
                            "INSERT INTO attendance (user_id, date, status) VALUES (?, ?, 'absent')",
                            [user.id, yesterday]
                        );
                        console.log(`Marked User ${user.id} as Absent for ${yesterday}`);
                    }
                }
            }
            return { success: true, message: 'Absent marking completed' };
        } catch (error) {
            console.error('Error in markAbsent:', error);
            throw error;
        }
    }

    // New: Mark leave days for an approved application
    static async markLeaveDays(userId, startDate, endDate, leaveApplicationId, leaveType) {
        const start = moment(startDate);
        const end = moment(endDate);

        for (let m = moment(start); m.isSameOrBefore(end); m.add(1, 'days')) {
            const dateStr = m.format('YYYY-MM-DD');
            await pool.query(
                `INSERT INTO attendance (user_id, date, status, is_leave_day, leave_application_id, leave_type)
                 VALUES (?, ?, 'leave', 1, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                 is_leave_day = 1, 
                 leave_application_id = ?, 
                 leave_type = ?`,
                [userId, dateStr, leaveApplicationId, leaveType, leaveApplicationId, leaveType]
            );
        }
    }

    // Get history for all managers (HR/Admin view)
    static async getManagersHistory(startDate, endDate) {
        const query = `
            SELECT 
                u.id as user_id, 
                u.name as employee_name, 
                u.email,
                COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as present_days,
                COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
                COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_days
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id AND a.date BETWEEN ? AND ?
            WHERE u.role_type = 'manager'
            GROUP BY u.id, u.name, u.email
        `;
        const [rows] = await pool.query(query, [startDate, endDate]);
        return rows;
    }

    // Auto check-out sessions (Phase 7 & 8: Based on shift window)
    static async autoCheckoutSessions() {
        try {
            const [activeSessions] = await pool.query(
                "SELECT a.* FROM attendance a WHERE a.status = 'checked_in'"
            );

            const now = moment().tz('Asia/Karachi');
            let updatedCount = 0;

            for (const session of activeSessions) {
                const checkInDateStr = moment(session.date).format('YYYY-MM-DD');
                const checkInDateTime = moment.tz(`${checkInDateStr} ${session.check_in_time}`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Karachi');
                
                // For Phase 7: Calculate diff from check-in
                const diffHours = now.diff(checkInDateTime, 'hours', true);

                if (diffHours >= 9) {
                    const autoCheckOutMoment = moment(checkInDateTime).add(9, 'hours');
                    const checkOutTime = autoCheckOutMoment.format('HH:mm:ss');
                    const hoursWorked = "09:00";

                    await pool.query(
                        `UPDATE attendance 
                         SET check_out_time = ?,
                             check_out_location = ?,
                             check_out_latitude = ?,
                             check_out_longitude = ?,
                             hours_worked = ?,
                             status = 'completed'
                         WHERE id = ?`,
                        [checkOutTime, session.check_in_location, session.check_in_latitude, session.check_in_longitude, hoursWorked, session.id]
                    );
                    updatedCount++;
                }
            }
            return { success: true, updatedCount };
        } catch (error) {
            console.error('Error in autoCheckoutSessions:', error);
            throw error;
        }
    }
}

module.exports = AttendanceModel;