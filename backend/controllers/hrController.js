const UserModel = require('../models/UserModel');
const LeaveBalanceModel = require('../models/LeaveBalanceModel');
const LeaveTypeModel = require('../models/LeaveTypeModel');
const bcrypt = require('bcryptjs');
const authConfig = require('../config/auth');
const EmailHelper = require('../utils/emailHelper');

class HRController {
    // Phase 2 Step 2: Create Manager
    static async createManager(req, res, next) {
        try {
            const { name, email, phone, cnic, department, designation, password } = req.body;
            
            // Auto-generate password if missing
            const finalPassword = password || Math.random().toString(36).slice(-8);

            // Hash password
            const salt = await bcrypt.genSalt(authConfig.bcryptSaltRounds);
            const hashedPassword = await bcrypt.hash(finalPassword, salt);

            // Create manager user
            const userId = await UserModel.create({
                name,
                email,
                password: hashedPassword,
                role_type: req.body.role_type || 'manager', // Use provided role_type
                phone,
                cnic,
                department,
                designation
            });

            // Send welcome email (with unhashed password)
            const emailStatus = await EmailHelper.sendWelcomeEmail(email, name, finalPassword);

            res.status(201).json({
                success: true,
                message: 'Manager account created successfully',
                data: { id: userId, email },
                email_sent: emailStatus.success,
                email_error: emailStatus.success ? null : emailStatus.error
            });
        } catch (error) {
            next(error);
        }
    }

    // Phase 2 Step 3: Create Employee
    static async createEmployee(req, res, next) {
        try {
            const {
                name, email, phone, cnic, department, designation,
                manager_id, reporting_to, leave_quota, password
            } = req.body;

            // Auto-generate password if missing
            const finalPassword = password || Math.random().toString(36).slice(-8);

            // Hash password
            const salt = await bcrypt.genSalt(authConfig.bcryptSaltRounds);
            const hashedPassword = await bcrypt.hash(finalPassword, salt);

            // Create employee user
            const userId = await UserModel.create({
                name,
                email,
                password: hashedPassword,
                role_type: req.body.role_type || 'employee', // Use provided role_type
                phone,
                cnic,
                department,
                designation,
                manager_id,
                reporting_to
            });

            // Allocate Leave Quota
            if (leave_quota && Array.isArray(leave_quota)) {
                for (const quota of leave_quota) {
                    await LeaveBalanceModel.allocateQuota({
                        employee_id: userId,
                        leave_type_id: quota.leave_type_id,
                        total_allocated: quota.allocated,
                        year: new Date().getFullYear(),
                        created_by_hr_id: req.userId
                    });
                }
            }

            // Send welcome email (with unhashed password)
            const emailStatus = await EmailHelper.sendWelcomeEmail(email, name, finalPassword);

            res.status(201).json({
                success: true,
                message: 'Employee account created successfully with leave quota',
                data: { id: userId, email, password: finalPassword },
                email_sent: emailStatus.success,
                email_error: emailStatus.success ? null : emailStatus.error
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all potential managers/approvers (for dropdown in employee creation)
    static async getManagers(req, res, next) {
        try {
            const [managers] = await require('../config/database').pool.query(
                'SELECT id, name, email, department, designation, role_type FROM users WHERE role_type IN (?, ?, ?) AND status = ?',
                ['manager', 'gm', 'ceo', 'active']
            );
            res.json({
                success: true,
                data: managers
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all leave types (for quota allocation form)
    static async getLeaveTypes(req, res, next) {
        try {
            const leaveTypes = await LeaveTypeModel.getAll();
            res.json({
                success: true,
                data: leaveTypes
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = HRController;
