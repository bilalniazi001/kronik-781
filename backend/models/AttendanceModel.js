const { pool } = require('../config/database');
const moment = require('moment-timezone');

class AttendanceModel {
    // Check in
    static async checkIn(userId, checkInData) {
        const { latitude, longitude, location_name } = checkInData;
        const currentTime = moment().tz('Asia/Karachi').format('HH:mm:ss');
        const currentDate = moment().tz('Asia/Karachi').format('YYYY-MM-DD');

        // Check if there's an active (non-completed) session for today
        const [existing] = await pool.query(
            'SELECT id FROM attendance WHERE user_id = ? AND date = ? AND status = "checked_in"',
            [userId, currentDate]
        );

        if (existing.length > 0) {
            throw new Error('Already checked in');
        }

        // Create location string
        const location = location_name || `${latitude},${longitude}`;

        const [result] = await pool.query(
            `INSERT INTO attendance 
            (user_id, date, check_in_time, check_in_location, check_in_latitude, check_in_longitude, status)
            VALUES (?, ?, ?, ?, ?, ?, 'checked_in')`,
            [userId, currentDate, currentTime, location, latitude, longitude]
        );

        return {
            id: result.insertId,
            date: currentDate,
            check_in_time: currentTime,
            location
        };
    }

    // Check out
    static async checkOut(userId, checkOutData) {
        const { latitude, longitude, location_name } = checkOutData;
        const currentTime = moment().tz('Asia/Karachi').format('HH:mm:ss');
        const currentDate = moment().tz('Asia/Karachi').format('YYYY-MM-DD');

        // Find the latest active check-in record for today
        const [attendance] = await pool.query(
            `SELECT * FROM attendance 
             WHERE user_id = ? AND date = ? AND status = 'checked_in'
             ORDER BY id DESC LIMIT 1`,
            [userId, currentDate]
        );

        if (attendance.length === 0) {
            throw new Error('No check-in record found for today');
        }

        if (attendance[0].check_out_time) {
            throw new Error('Already checked out today');
        }

        // Calculate hours worked
        const checkInTime = attendance[0].check_in_time;
        const checkOutMoment = moment(currentTime, 'HH:mm:ss');
        const checkInMoment = moment(checkInTime, 'HH:mm:ss');
        const duration = moment.duration(checkOutMoment.diff(checkInMoment));
        const hoursWorked = `${String(Math.floor(duration.asHours())).padStart(2, '0')}:${String(duration.minutes()).padStart(2, '0')}`;

        // Create location string
        const location = location_name || `${latitude},${longitude}`;

        const [result] = await pool.query(
            `UPDATE attendance 
             SET check_out_time = ?,
                 check_out_location = ?,
                 check_out_latitude = ?,
                 check_out_longitude = ?,
                 hours_worked = ?,
                 status = 'completed'
             WHERE id = ?`,
            [currentTime, location, latitude, longitude, hoursWorked, attendance[0].id]
        );

        return {
            id: attendance[0].id,
            date: currentDate,
            check_in_time: attendance[0].check_in_time,
            check_out_time: currentTime,
            hours_worked: hoursWorked,
            location
        };
    }

    // Get today's attendance status
    static async getTodayStatus(userId) {
        const [rows] = await pool.query(
            `SELECT * FROM attendance 
             WHERE user_id = ? AND date = CURDATE()
             ORDER BY id DESC LIMIT 1`,
            [userId]
        );

        if (rows.length === 0) {
            return {
                checked_in: false,
                checked_out: false,
                message: 'Not checked in today'
            };
        }

        return {
            id: rows[0].id,
            checked_in: !!rows[0].check_in_time,
            checked_out: !!rows[0].check_out_time,
            check_in_time: rows[0].check_in_time,
            check_out_time: rows[0].check_out_time,
            check_in_location: rows[0].check_in_location,
            check_out_location: rows[0].check_out_location,
            hours_worked: rows[0].hours_worked,
            status: rows[0].status
        };
    }

    // Get user attendance history with gap filling for absents/leaves
    static async getUserHistory(userId, startDate, endDate, limit = 31, offset = 0) {
        // 1. Get User Creation Date to bound the report
        const [user] = await pool.query('SELECT created_at, joining_date FROM users WHERE id = ?', [userId]);
        if (!user[0]) throw new Error('User not found');
        
        const registrationDate = moment(user[0].joining_date || user[0].created_at).startOf('day');
        const rangeStart = moment(startDate).startOf('day');
        const rangeEnd = moment(endDate).startOf('day');
        
        // Final start date is the later of requested start and registration date
        const actualStart = moment.max(registrationDate, rangeStart);
        
        // 2. Fetch actual attendance records
        const [attendanceRows] = await pool.query(
            `SELECT id, date, check_in_time, check_out_time, 
                    check_in_location, check_out_location,
                    hours_worked, status
             FROM attendance 
             WHERE user_id = ? 
               AND date BETWEEN ? AND ?
             ORDER BY date DESC`,
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

        // 4. Map existing data for quick lookup
        const attendanceMap = new Map();
        attendanceRows.forEach(row => {
            attendanceMap.set(moment(row.date).format('YYYY-MM-DD'), row);
        });

        // 5. Generate full history for the range
        const fullHistory = [];
        // Only count up to today or rangeEnd, whichever is earlier
        const actualEnd = moment.min(moment().endOf('day'), rangeEnd.endOf('day'));
        let currentDate = moment(actualEnd); // Start from end to match DESC order
        
        while (currentDate.isSameOrAfter(actualStart)) {
            const dateStr = currentDate.format('YYYY-MM-DD');
            const attendanceRecord = attendanceMap.get(dateStr);
            
            // Check if it's a leave day first (Leave overrides Absent)
            const leave = leaveRows.find(l => 
                currentDate.isSameOrAfter(moment(l.start_date).startOf('day')) && 
                currentDate.isSameOrBefore(moment(l.end_date).startOf('day'))
            );

            if (attendanceRecord && (attendanceRecord.status === 'completed' || attendanceRecord.status === 'checked_in')) {
                // Real attendance takes highest priority
                fullHistory.push(attendanceRecord);
            } else if (leave) {
                // Approved leave takes second priority
                fullHistory.push({
                    date: dateStr,
                    status: 'leave',
                    leave_type: leave.leave_type,
                    hours_worked: '00:00'
                });
            } else if (attendanceRecord) {
                // Existing record (likely 'absent' or other)
                fullHistory.push(attendanceRecord);
            } else {
                // No record at all
                fullHistory.push({
                    date: dateStr,
                    status: 'absent',
                    hours_worked: '00:00'
                });
            }
            currentDate.subtract(1, 'days');
        }

        const total = fullHistory.length;
        const pagedData = fullHistory.slice(offset, offset + limit);

        return {
            data: pagedData,
            total,
            limit,
            offset
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
            userQuery += ` AND role_type = ?`;
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

            const totalWorkingDays = actualEnd.diff(actualStart, 'days') + 1;
            
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
                let current = moment.max(actualStart, moment(l.start_date).startOf('day'));
                let lEnd = moment.min(actualEnd, moment(l.end_date).startOf('day'));
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

            // Skip weekends (optional, based on company policy, keeping it generic here)
            // if (dayName === 'Sunday') return; 

            // 1. Get all active users with role_type 'user' (exclude admins/hr from auto-absent if desired)
            const [users] = await pool.query("SELECT id FROM users WHERE role_type = 'user'");

            for (const user of users) {
                // 2. Check if attendance record exists
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

    // Auto check-out sessions older than 9 hours
    static async autoCheckoutSessions() {
        try {
            // Find all active check-ins (regardless of date, in case of overnight shifts)
            const [activeSessions] = await pool.query(
                "SELECT * FROM attendance WHERE status = 'checked_in'"
            );

            const now = moment().tz('Asia/Karachi');
            let updatedCount = 0;

            for (const session of activeSessions) {
                // Combine date and time for comparison
                const checkInDateStr = moment(session.date).format('YYYY-MM-DD');
                const checkInDateTime = moment.tz(`${checkInDateStr} ${session.check_in_time}`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Karachi');
                
                const diffHours = now.diff(checkInDateTime, 'hours', true);

                if (diffHours >= 9) {
                    const autoCheckOutMoment = moment(checkInDateTime).add(9, 'hours');
                    const checkOutTime = autoCheckOutMoment.format('HH:mm:ss');
                    const hoursWorked = "09:00"; // Exactly 9 hours

                    await pool.query(
                        `UPDATE attendance 
                         SET check_out_time = ?,
                             check_out_location = ?,
                             check_out_latitude = ?,
                             check_out_longitude = ?,
                             hours_worked = ?,
                             status = 'completed'
                         WHERE id = ?`,
                        [
                            checkOutTime, 
                            session.check_in_location, 
                            session.check_in_latitude, 
                            session.check_in_longitude, 
                            hoursWorked, 
                            session.id
                        ]
                    );
                    updatedCount++;
                    console.log(`Auto-checked out record ${session.id} for user ${session.user_id}`);
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