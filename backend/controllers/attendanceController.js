const AttendanceModel = require('../models/AttendanceModel');
const UserModel = require('../models/UserModel');
const { getLocationDetails } = require('../utils/geolocationHelper');
const AuthMiddleware = require('../middleware/authMiddleware');

class AttendanceController {
    // Check In (as per FDC 4.3.2)
    static async checkIn(req, res, next) {
        try {
            const { latitude, longitude } = req.body;
            const user = await UserModel.findById(req.userId);

            if (user && user.userType === 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Attendance tracking is not available for admin accounts'
                });
            }

            // Get location name from coordinates
            const locationName = await getLocationDetails(latitude, longitude);

            const result = await AttendanceModel.checkIn(req.userId, {
                latitude,
                longitude,
                location_name: locationName
            });

            res.json({
                success: true,
                message: 'Check-In Successful!',
                data: result
            });

        } catch (error) {
            if (error.message === 'Already checked in') {
                return res.status(400).json({
                    success: false,
                    message: 'You have already checked in'
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

            if (user && user.userType === 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Attendance tracking is not available for admin accounts'
                });
            }

            // Get location name from coordinates
            const locationName = await getLocationDetails(latitude, longitude);

            const result = await AttendanceModel.checkOut(req.userId, {
                latitude,
                longitude,
                location_name: locationName
            });

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
                present_days: attendance.data.filter(a => a.status === 'completed').length,
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
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            const firstDayOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            const lastDayOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

            // Get current month attendance summary
            const monthAttendance = await AttendanceModel.getUserHistory(
                req.userId,
                firstDayOfMonth,
                lastDayOfMonth,
                100,
                0
            );

            const attendanceDays = monthAttendance.data.filter(a => a.status === 'completed').length;
            const absentDays = monthAttendance.data.filter(a => a.status === 'absent').length;
            const leaveDays = monthAttendance.data.filter(a => a.status === 'leave').length;
            const incompleteDays = monthAttendance.data.filter(a => a.status === 'checked_in').length;

            // Calculate weekly hours (current week: Monday to Sunday)
            const today = new Date();
            const dayOfWeek = today.getDay();
            const monday = new Date(today);
            monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const weekStartStr = monday.toISOString().split('T')[0];
            const weekEndStr = sunday.toISOString().split('T')[0];

            const weekAttendance = await AttendanceModel.getUserHistory(
                req.userId,
                weekStartStr,
                weekEndStr,
                7,
                0
            );

            // Sum weekly hours
            let weeklyMinutes = 0;
            weekAttendance.data.forEach(record => {
                if (record.hours_worked) {
                    const parts = record.hours_worked.split(':');
                    weeklyMinutes += parseInt(parts[0]) * 60 + parseInt(parts[1] || 0);
                }
            });
            const weeklyHours = `${Math.floor(weeklyMinutes / 60)}h ${weeklyMinutes % 60}m`;

            res.json({
                success: true,
                stats: {
                    month: currentMonth,
                    year: currentYear,
                    attendance_days: attendanceDays,
                    absent_days: absentDays,
                    leave_days: leaveDays,
                    incomplete_days: incompleteDays,
                    total_records: monthAttendance.total,
                    weekly_hours: weeklyHours,
                    weekly_minutes: weeklyMinutes
                }
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
