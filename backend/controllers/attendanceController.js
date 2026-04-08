const AttendanceModel = require('../models/AttendanceModel');
const UserModel = require('../models/UserModel');
const { pool } = require('../config/database');
const { getLocationDetails } = require('../utils/geolocationHelper');
const AuthMiddleware = require('../middleware/authMiddleware');
const SettingsModel = require('../models/SettingsModel');
const moment = require('moment-timezone');
const CacheManager = require('../utils/cacheManager');

class AttendanceController {
    // Check In (as per FDC 4.3.2)
    static async checkIn(req, res, next) {
        try {
            const { latitude, longitude } = req.body;
            const user = await UserModel.findById(req.userId);

            if (user && (user.userType === 'admin' || user.role_type === 'ceo')) {
                return res.status(403).json({
                    success: false,
                    message: 'Attendance tracking is not available for admin or CEO accounts'
                });
            }


            // Weekly Holiday Check
            const weeklyHolidays = await SettingsModel.getWeeklyHolidays();
            const today = moment().tz('Asia/Karachi').format('dddd');
            if (weeklyHolidays.has(today)) {
                return res.status(403).json({
                    success: false,
                    message: `Today is ${today} (Weekly Holiday). Attendance is disabled.`
                });
            }

            // Get location name from coordinates
            const locationName = await getLocationDetails(latitude, longitude);

            const result = await AttendanceModel.checkIn(req.userId, {
                latitude,
                longitude,
                location_name: locationName
            });

            // Invalidate caches so new check-in is reflected immediately
            CacheManager.invalidate(`USER_STATS_${req.userId}`);
            CacheManager.invalidate('ADMIN_DASHBOARD_STATS');

            res.json({
                success: true,
                message: 'Check-In Successful!',
                data: result
            });

        } catch (error) {
            if (error.message === 'Already checked in') {
                return res.status(400).json({
                    success: false,
                    message: 'You have already checked in for this shift.'
                });
            }
            if (error.message === 'Too early to check in for this shift cycle.') {
                return res.status(400).json({
                    success: false,
                    message: 'It is too early to check in. Please wait until your shift starts.'
                });
            }
            next(error);
        }
    }

    // Check Out (as per FDC 4.3.3)
    static async checkOut(req, res, next) {
        try {
            const { latitude, longitude } = req.body;
            const user = await UserModel.findById(req.userId);

            if (user && (user.userType === 'admin' || user.role_type === 'ceo')) {
                return res.status(403).json({
                    success: false,
                    message: 'Attendance tracking is not available for admin or CEO accounts'
                });
            }

            const locationName = await getLocationDetails(latitude, longitude);

            const result = await AttendanceModel.checkOut(req.userId, {
                latitude,
                longitude,
                location_name: locationName
            });

            // Invalidate caches so check-out is reflected immediately
            CacheManager.invalidate(`USER_STATS_${req.userId}`);
            CacheManager.invalidate('ADMIN_DASHBOARD_STATS');

            res.json({
                success: true,
                message: 'Check-Out Successful!',
                data: result
            });

        } catch (error) {
            if (error.message === 'No check-in record found for today') {
                return res.status(400).json({
                    success: false,
                    message: 'No check-in record found for today'
                });
            }
            if (error.message === 'Already checked out today') {
                return res.status(400).json({
                    success: false,
                    message: 'You have already checked out today'
                });
            }
            next(error);
        }
    }

    // Get today's status
    static async getTodayStatus(req, res, next) {
        try {
            const status = await AttendanceModel.getTodayStatus(req.userId);

            res.json({
                success: true,
                data: status
            });

        } catch (error) {
            next(error);
        }
    }

    // Check if user can logout (as per FDC 4.3.5)
    static async canLogout(req, res, next) {
        try {
            const todayAttendance = await AttendanceModel.getTodayStatus(req.userId);

            const canLogout = !todayAttendance.checked_in || todayAttendance.checked_out;

            res.json({
                success: true,
                can_logout: canLogout,
                message: canLogout ?
                    'You can logout' :
                    'Please check-out first before logging out'
            });

        } catch (error) {
            next(error);
        }
    }

    // Get monthly report (as per FDC 4.4.7)
    static async getMonthlyReport(req, res, next) {
        try {
            const { month, year } = req.query;

            const now = new Date();
            const targetMonth = month || now.getMonth() + 1;
            const targetYear = year || now.getFullYear();

            const firstDay = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
            const lastDay = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

            const attendance = await AttendanceModel.getUserHistory(
                req.userId,
                firstDay,
                lastDay,
                100,
                0
            );

            // Calculate summary
            const summary = {
                total_days: attendance.total,
                present_days: attendance.data.filter(a => a.status === 'completed' || a.status === 'checked_in').length,
                incomplete_days: attendance.data.filter(a => a.status === 'checked_in').length,
                total_hours: attendance.data.reduce((acc, curr) => {
                    if (curr.hours_worked) {
                        const [hours, minutes] = curr.hours_worked.split(':').map(Number);
                        return acc + hours + (minutes / 60);
                    }
                    return acc;
                }, 0).toFixed(2)
            };

            res.json({
                success: true,
                month: targetMonth,
                year: targetYear,
                summary,
                attendance: attendance.data
            });

        } catch (error) {
            next(error);
        }
    }
    // Get user dashboard stats (weekly hours, attendance, leave for current month)
    static async getUserStats(req, res, next) {
        try {
            const moment = require('moment-timezone');

            // Check cache first (2 minutes TTL)
            const cacheKey = `USER_STATS_${req.userId}`;
            const cachedStats = CacheManager.get(cacheKey);
            if (cachedStats) {
                return res.json({
                    success: true,
                    stats: cachedStats,
                    from_cache: true
                });
            }
            const now = moment().tz('Asia/Karachi');

            const currentMonth = now.month() + 1;
            const currentYear = now.year();
            const firstDayOfMonth = now.clone().startOf('month').format('YYYY-MM-DD');
            const lastDayOfMonth = now.clone().endOf('month').format('YYYY-MM-DD');

            // Get current month attendance summary
            const monthAttendance = await AttendanceModel.getUserHistory(
                req.userId,
                firstDayOfMonth,
                lastDayOfMonth,
                100,
                0
            );

            const attendanceDays = monthAttendance.data.filter(a => a.status === 'completed' || a.status === 'checked_in').length;
            const absentDays = monthAttendance.data.filter(a => a.status === 'absent').length;
            // Calculate accurate leave days for the whole month (even future ones)
            const [leaveInfo] = await pool.query(
                `SELECT la.*, lt.name as leave_type
                 FROM leave_applications la
                 JOIN leave_application_details lad ON la.id = lad.application_id
                 JOIN leave_types lt ON lad.leave_type_id = lt.id
                 WHERE la.employee_id = ? 
                   AND la.status = 'approved'
                   AND (la.start_date <= ? AND la.end_date >= ?)
                 ORDER BY la.start_date DESC`,
                [req.userId, lastDayOfMonth, firstDayOfMonth]
            );

            // Deduplicate if multiple types in one app (simple count of total_days is better)
            const [totalLeaveDaysRow] = await pool.query(
                `SELECT SUM(total_days) as total 
                 FROM leave_applications 
                 WHERE employee_id = ? AND status = 'approved'
                 AND (start_date <= ? AND end_date >= ?)`,
                [req.userId, lastDayOfMonth, firstDayOfMonth]
            );

            const leaveDays = totalLeaveDaysRow[0]?.total || 0;
            const recentLeaves = leaveInfo.slice(0, 2); // Get top 2 for details
            const incompleteDays = monthAttendance.data.filter(a => a.status === 'checked_in').length;

            // Get today's sessions (history)
            const [userRows] = await pool.query(`
                SELECT u.shift_id, s.start_time 
                FROM users u 
                LEFT JOIN shifts s ON u.shift_id = s.id 
                WHERE u.id = ?`, [req.userId]);
            
            const shiftStart = userRows[0]?.start_time || '09:00:00';
            const { logicalDate } = AttendanceModel.getLogicalShift(shiftStart);

            const [historyRows] = await pool.query(
                `SELECT * FROM attendance 
                 WHERE user_id = ? AND date = ?
                 ORDER BY check_in_time ASC`,
                [req.userId, logicalDate]
            );

            // Calculate weekly hours (current week: Monday to Sunday)
            const weekStart = now.clone().startOf('isoWeek');
            const weekEnd = now.clone().endOf('isoWeek');

            const monthAttendanceForWeek = await AttendanceModel.getUserHistory(
                req.userId,
                weekStart.format('YYYY-MM-DD'),
                weekEnd.format('YYYY-MM-DD'),
                7,
                0
            );

            // Sum weekly hours and extra hours safely
            let weeklyMinutes = 0;
            let weeklyExtraMinutes = 0;
            monthAttendanceForWeek.data.forEach(record => {
                if (record.hours_worked && typeof record.hours_worked === 'string') {
                    const parts = record.hours_worked.split(':');
                    const h = parseInt(parts[0]) || 0;
                    const m = parseInt(parts[1]) || 0;
                    weeklyMinutes += (h * 60 + m);
                }
                if (record.extra_hours && typeof record.extra_hours === 'string') {
                    const parts = record.extra_hours.split(':');
                    const h = parseInt(parts[0]) || 0;
                    const m = parseInt(parts[1]) || 0;
                    weeklyExtraMinutes += (h * 60 + m);
                }
            });

            const statsData = {
                attendance_days: attendanceDays,
                absent_days: absentDays,
                leave_days: leaveDays,
                incomplete_days: incompleteDays,
                weekly_hours: `${Math.floor(weeklyMinutes / 60).toString().padStart(2, '0')}:${(weeklyMinutes % 60).toString().padStart(2, '0')}`,
                weekly_extra_hours: `${Math.floor(weeklyExtraMinutes / 60).toString().padStart(2, '0')}:${(weeklyExtraMinutes % 60).toString().padStart(2, '0')}`,
                recent_leaves: recentLeaves,
                history: historyRows
            };

            // Cache the stats for 2 minutes
            CacheManager.set(cacheKey, statsData, 120);

            res.json({
                success: true,
                stats: statsData
            });

        } catch (error) {
            next(error);
        }
    }

    // Get team report for managers/HR
    static async getTeamReport(req, res, next) {
        try {
            const { start_date, end_date, type } = req.query; 

            const user = await UserModel.findById(req.userId);
            if (!user || (user.role_type !== 'manager' && user.role_type !== 'hr' && user.role_type !== 'ceo' && user.userType !== 'admin')) {
                return res.status(403).json({ success: false, message: 'Unauthorized. Only managers, HR, or CEO can view team reports.' });
            }

            const now = new Date();
            const start = start_date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            const end = end_date || now.toISOString().split('T')[0];

            let attendance;
            if (type === 'managers') {
                // HR/Admin only: Get all managers
                if (user.role_type !== 'hr' && user.role_type !== 'ceo' && user.userType !== 'admin') {
                    return res.status(403).json({ success: false, message: 'Unauthorized. Only HR/Admin can view manager reports.' });
                }
                attendance = await AttendanceModel.getManagersHistory(start, end);
            } else {
                // Default: get employees/team
                attendance = await AttendanceModel.getTeamHistory(
                    req.userId,
                    start,
                    end,
                    100,
                    0
                );
            }

            res.json({
                success: true,
                data: attendance.data || attendance, // Handle differences in return format if any
                total: attendance.total || (Array.isArray(attendance) ? attendance.length : 0)
            });

        } catch (error) {
            next(error);
        }
    }

    // Get team summary for managers
    static async getTeamSummary(req, res, next) {
        try {
            const { start_date, end_date, type } = req.query; // type: 'employees', 'managers', or 'hr'

            const user = await UserModel.findById(req.userId);
            if (!user || (user.role_type !== 'manager' && user.role_type !== 'hr' && user.role_type !== 'ceo' && user.userType !== 'admin')) {
                return res.status(403).json({ success: false, message: 'Unauthorized. Only managers, HR, or CEO can view team reports.' });
            }

            const now = new Date();
            const start = start_date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            const end = end_date || now.toISOString().split('T')[0];

            let managerId = null;
            let roleType = type === 'managers' ? 'manager' : (type === 'hr' ? 'hr' : 'employee');

            // If manager, only their own team. If HR or CEO, see everyone by default.
            if (user.role_type === 'manager') {
                managerId = user.id;
                roleType = 'employee'; // Managers only see their employees
            } else if (user.role_type === 'ceo') {
                // CEO sees everyone, type parameter determines if employees or managers list
                managerId = null; 
                if (type === 'managers') {
                    roleType = ['manager', 'gm', 'acm'];
                } else if (type === 'employees') {
                    roleType = ['employee', 'tl', 'atl'];
                } else if (type === 'hr') {
                    roleType = ['hr'];
                }
            }

            const summary = await AttendanceModel.getTeamSummary(
                managerId,
                start,
                end,
                roleType
            );

            res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            next(error);
        }
    }

    // Get specific team member report
    static async getTeamMemberReport(req, res, next) {
        try {
            const { start_date, end_date } = req.query;
            const { memberId } = req.params;

            const user = await UserModel.findById(req.userId);
            if (!user || (user.role_type !== 'manager' && user.role_type !== 'hr' && user.role_type !== 'ceo' && user.userType !== 'admin')) {
                return res.status(403).json({ success: false, message: 'Unauthorized. Only managers, HR, or CEO can view team reports.' });
            }

            // Ensure member actually belongs to manager or requester has higher rank
            const member = await UserModel.findById(memberId);
            if (!member) {
                return res.status(404).json({ success: false, message: 'Employee not found.' });
            }

            const hasAccess = await AuthMiddleware.canAccessUser(user, member);
            if (!hasAccess) {
                return res.status(403).json({ success: false, message: 'Unauthorized. You do not have permission to view this user\'s report.' });
            }

            const now = new Date();
            const start = start_date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            const end = end_date || now.toISOString().split('T')[0];

            const attendance = await AttendanceModel.getUserHistory(
                memberId,
                start,
                end,
                100, // limit
                0
            );

            res.json({
                success: true,
                data: attendance.data,
                total: attendance.total
            });

        } catch (error) {
            next(error);
        }
    }

    // Get history for a specific user
    static async getUserHistory(req, res, next) {
        try {
            const { start_date, end_date, user_id } = req.query;
            const targetUserId = user_id || req.userId;

            // Import moment-timezone if not already imported
            const moment = require('moment-timezone');

            const now = moment().tz('Asia/Karachi');
            const start = start_date || now.clone().startOf('month').format('YYYY-MM-DD');
            const end = end_date || now.format('YYYY-MM-DD');

            const history = await AttendanceModel.getUserHistory(
                targetUserId,
                start,
                end,
                req.query.limit || 31,
                req.query.offset || 0
            );

            res.json({
                success: true,
                ...history
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = AttendanceController;
