const BreakRequestModel = require('../models/BreakRequestModel');
const UserModel = require('../models/UserModel');
const NotificationModel = require('../models/NotificationModel');
const EmailHelper = require('../utils/emailHelper');

class BreakController {
    static async applyBreak(req, res, next) {
        try {
            const { date, duration_hours, reason } = req.body;
            const employee_id = req.userId;

            const user = await UserModel.findById(employee_id);
            if (!user.manager_id && user.role_type !== 'ceo') {
                return res.status(400).json({ success: false, message: 'No manager assigned to your account' });
            }

            const breakId = await BreakRequestModel.create({
                employee_id,
                manager_id: user.manager_id,
                date,
                duration_hours,
                reason
            });

            // Notify Manager (in-app)
            if (user.manager_id) {
                await NotificationModel.create({
                    user_id: user.manager_id,
                    from_user_id: employee_id,
                    title: 'New Break Request',
                    message: `${user.name} has applied for a ${duration_hours}h break on ${date}.`,
                    link: '/leave-approvals',
                    type: 'portal'
                });

                // Email Manager
                try {
                    const manager = await UserModel.findById(user.manager_id);
                    if (manager && manager.email) {
                        await EmailHelper.sendBreakManagerNotification(
                            manager.email,
                            manager.name,
                            user.name,
                            { date, duration_hours, reason }
                        );
                    }
                } catch (emailErr) {
                    console.error('Break email to manager failed (non-fatal):', emailErr.message);
                }
            }

            res.status(201).json({ success: true, message: 'Break request submitted successfully', data: { breakId } });
        } catch (error) {
            next(error);
        }
    }

    static async getMyBreaks(req, res, next) {
        try {
            const breaks = await BreakRequestModel.getByEmployee(req.userId);
            res.json({ success: true, data: breaks });
        } catch (error) {
            next(error);
        }
    }

    static async getPendingBreaks(req, res, next) {
        try {
            const breaks = await BreakRequestModel.getPendingForManager(req.userId);
            res.json({ success: true, data: breaks });
        } catch (error) {
            next(error);
        }
    }

    static async managerAction(req, res, next) {
        try {
            const { id } = req.params;
            const { status, reason } = req.body; // 'approved' or 'rejected'
            const manager_id = req.userId;

            const breakReq = await BreakRequestModel.findById(id);
            if (!breakReq) {
                return res.status(404).json({ success: false, message: 'Break request not found' });
            }
            if (String(breakReq.manager_id) !== String(manager_id)) {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }

            await BreakRequestModel.updateStatus(id, status);

            const statusLabel = status === 'approved' ? 'Approved ✅' : 'Rejected ❌';

            // Notify Employee (in-app)
            await NotificationModel.create({
                user_id: breakReq.employee_id,
                from_user_id: manager_id,
                title: `Break Request ${statusLabel}`,
                message: `Your break request for ${breakReq.date} (${breakReq.duration_hours}h) has been ${status}.`,
                type: 'portal'
            });

            // Email Employee
            try {
                const employee = await UserModel.findById(breakReq.employee_id);
                const manager = await UserModel.findById(manager_id);
                if (employee && employee.email) {
                    await EmailHelper.sendBreakStatusEmail(
                        employee.email,
                        employee.name,
                        { date: breakReq.date, duration_hours: breakReq.duration_hours, reason: breakReq.reason },
                        status,
                        manager?.name || 'Your Manager'
                    );
                }
            } catch (emailErr) {
                console.error('Break status email failed (non-fatal):', emailErr.message);
            }

            res.json({ success: true, message: `Break request ${status}` });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = BreakController;
