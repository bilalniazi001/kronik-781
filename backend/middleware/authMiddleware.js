const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const UserModel = require('../models/UserModel');
const AdminModel = require('../models/AdminModel');
const { getRank, RANKS } = require('../config/constants');

class AuthMiddleware {
    // Verify JWT token
    static async verifyToken(req, res, next) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access denied. No token provided.'
                });
            }

            const decoded = jwt.verify(token, authConfig.jwtSecret);

            // Verify user/admin still exists and is active
            if (decoded.userType === 'user') {
                const user = await UserModel.findById(decoded.id);
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not found or inactive'
                    });
                }
                req.user = user;
                req.userType = 'user';
            } else {
                const admin = await AdminModel.findById(decoded.id);
                if (!admin) {
                    return res.status(401).json({
                        success: false,
                        message: 'Admin not found or inactive'
                    });
                }
                req.user = admin;
                req.userType = 'admin';
                req.adminRole = admin.role;
            }

            req.userId = decoded.id;
            req.userRole = decoded.role;
            next();

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired'
                });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }
            next(error);
        }
    }

    // Check if user is admin
    static isAdmin(req, res, next) {
        if (req.userType !== 'admin' && req.user?.role_type !== 'hr' && req.user?.role_type !== 'ceo') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin, HR, or CEO access required.'
            });
        }
        next();
    }

    // Check if user is HR
    static isHR(req, res, next) {
        if (req.user?.role_type !== 'hr' && req.userType !== 'admin' && req.user?.role_type !== 'ceo') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. HR or CEO only.'
            });
        }
        next();
    }

    // Check if user is Manager
    static isManager(req, res, next) {
        if (req.user?.role_type !== 'manager' && req.user?.role_type !== 'hr' && req.user?.role_type !== 'ceo' && req.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Manager, HR, or CEO only.'
            });
        }
        next();
    }

    // Check if user is CEO
    static isCEO(req, res, next) {
        if (req.user?.role_type !== 'ceo' && req.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. CEO only.'
            });
        }
        next();
    }

    // Check if user is super admin
    static isSuperAdmin(req, res, next) {
        if (req.userType !== 'admin' || req.adminRole !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super admin only.'
            });
        }
        next();
    }

    // Check permission
    static hasPermission(permission) {
        return (req, res, next) => {
            if (req.userType !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const permissions = authConfig.permissions[req.adminRole] || [];

            if (permissions.includes('*') || permissions.includes(permission)) {
                next();
            } else {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions'
                });
            }
        };
    }

    // Optional auth (doesn't require token)
    static optionalAuth(req, res, next) {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            req.user = null;
            return next();
        }

        try {
            const decoded = jwt.verify(token, authConfig.jwtSecret);
            req.userId = decoded.id;
            req.userRole = decoded.role;
            next();
        } catch (error) {
            req.user = null;
            next();
        }
    }

    // Check if requester has higher rank than target user
    static async canAccessUser(requester, targetUser) {
        if (requester.userType === 'admin') return true;
        
        const requesterRank = getRank(requester.role_type);
        const targetRank = getRank(targetUser.role_type);

        // Access if requester rank is strictly higher (lower number)
        // OR if requester is the direct manager
        if (requesterRank < targetRank) return true;
        if (targetUser.manager_id === requester.id) return true;

        return false;
    }
}

module.exports = AuthMiddleware;

module.exports = AuthMiddleware;