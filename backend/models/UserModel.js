const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
    // Create new user (signup)
    static async create(userData) {
        const {
            name, email, password, phone, cnic, address, profile_url,
            role_type, employee_id, designation, department, manager_id, reporting_to, joining_date,
            shift_id
        } = userData;

        const [result] = await pool.query(
            `INSERT INTO users (
                name, email, password, phone, cnic, address, profile_url,
                role_type, employee_id, designation, department, manager_id, reporting_to, joining_date,
                shift_id
            )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, email, password, phone, cnic, address, profile_url || null,
                role_type || 'employee', employee_id || null, designation || null,
                department || null, manager_id || null, reporting_to || null, joining_date || null,
                shift_id || null
            ]
        );

        return result.insertId;
    }

    // Find user by email
    static async findByEmail(email) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    // Find user by CNIC
    static async findByCNIC(cnic) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE cnic = ?',
            [cnic]
        );
        return rows[0];
    }

    // Find user by ID
    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT id, name, email, phone, cnic, address, profile_url, 
                    profile_image, role, role_type, employee_id, designation, department, 
                    manager_id, reporting_to, joining_date, shift_id, status, created_at, last_login
             FROM users WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    // Update user profile
    static async update(id, updateData) {
        const allowedFields = [
            'name', 'email', 'phone', 'cnic', 'address', 'profile_url', 'profile_image',
            'designation', 'department', 'manager_id', 'reporting_to', 'shift_id', 'status', 'role_type'
        ];
        const updates = [];
        const values = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) return false;

        values.push(id);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

        const [result] = await pool.query(query, values);
        return result.affectedRows > 0;
    }

    // Update password
    static async updatePassword(id, hashedPassword) {
        const [result] = await pool.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        return result.affectedRows > 0;
    }

    // Update last login
    static async updateLastLogin(id) {
        const [result] = await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Get all users (for admin)
    static async getAll(limit = 10, offset = 0, search = '', roleFilter = '') {
        let query = `
            SELECT id, name, email, phone, cnic, status, role, role_type, employee_id, designation, department, shift_id, created_at
            FROM users
            WHERE 1=1
        `;
        const values = [];

        if (roleFilter) {
            query += ` AND role_type = ?`;
            values.push(roleFilter);
        }

        if (search) {
            query += ` AND (name LIKE ? OR email LIKE ? OR cnic LIKE ? OR employee_id LIKE ?)`;
            const searchTerm = `%${search}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        values.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, values);
        return rows;
    }

    // Get total users count
    static async getCount(search = '', roleTypeFilter = '') {
        let query = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const values = [];

        if (roleTypeFilter) {
            query += ` AND role_type = ?`;
            values.push(roleTypeFilter);
        }

        if (search) {
            query += ` AND (name LIKE ? OR email LIKE ? OR cnic LIKE ?)`;
            const searchTerm = `%${search}%`;
            values.push(searchTerm, searchTerm, searchTerm);
        }

        const [rows] = await pool.query(query, values);
        return rows[0].total;
    }

    // Delete user (hard delete)
    static async delete(id) {
        const [result] = await pool.query(
            'DELETE FROM users WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    // Check if user has checked in today
    static async hasCheckedInToday(userId) {
        const [rows] = await pool.query(
            `SELECT id FROM attendance 
             WHERE user_id = ? AND date = CURDATE() AND check_in_time IS NOT NULL`,
            [userId]
        );
        return rows.length > 0;
    }

    // Check if user has checked out today
    static async hasCheckedOutToday(userId) {
        const [rows] = await pool.query(
            `SELECT id FROM attendance 
             WHERE user_id = ? AND date = CURDATE() AND check_out_time IS NOT NULL`,
            [userId]
        );
        return rows.length > 0;
    }

    // Get user's today's attendance
    static async getTodayAttendance(userId) {
        const [rows] = await pool.query(
            `SELECT * FROM attendance 
             WHERE user_id = ? AND date = CURDATE()`,
            [userId]
        );
        return rows[0];
    }

    // Get full organizational hierarchy
    static async getHierarchy() {
        const [users] = await pool.query(
            `SELECT id, name, email, role_type, designation, department, manager_id, profile_image, rank_weight 
             FROM users WHERE status = 'active' ORDER BY rank_weight ASC, name ASC`
        );

        // Map users by ID for quick lookup
        const userMap = {};
        users.forEach(u => {
            userMap[u.id] = { ...u, children: [] };
        });

        const ceoNode = users.find(u => u.role_type === 'ceo');
        const ceoId = ceoNode ? ceoNode.id : null;

        // Strict Role Hierarchy for orphans (those without valid manager_id)
        const roleTiers = ['ceo', 'hr', 'gm', 'acm', 'manager', 'tl', 'atl', 'employee'];
        
        // Group by role for easy tier linking
        const roleGroups = {};
        roleTiers.forEach(role => roleGroups[role] = []);
        users.forEach(u => {
            if (roleGroups[u.role_type]) {
                roleGroups[u.role_type].push(u.id);
            }
        });

        users.forEach(u => {
            let actualManagerId = u.manager_id;

            // SPECIAL RULE: HR always under CEO
            if (u.role_type === 'hr' && ceoId) {
                actualManagerId = ceoId;
            }

            // Fallback for orphans: link to the logical tier above
            if (!actualManagerId || !userMap[actualManagerId]) {
                const currentRoleIdx = roleTiers.indexOf(u.role_type);
                if (currentRoleIdx > 0) {
                    // Search for a manager in tiers above
                    for (let i = currentRoleIdx - 1; i >= 0; i--) {
                        const tierRole = roleTiers[i];
                        if (roleGroups[tierRole] && roleGroups[tierRole].length > 0) {
                            // Link to the first available person in the tier above
                            actualManagerId = roleGroups[tierRole][0];
                            break;
                        }
                    }
                }
            }

            if (actualManagerId && userMap[actualManagerId] && actualManagerId !== u.id) {
                userMap[actualManagerId].children.push(userMap[u.id]);
            }
        });

        // Roots are users who still have no manager (usually just the CEO)
        const roots = Object.values(userMap).filter(node => {
            // A node is a root if no one else claims it as a child in this construction
            // OR if it's the CEO
            return node.role_type === 'ceo' || (!node.manager_id && !Object.values(userMap).some(parent => parent.children.includes(node)));
        });

        // If multiple roots, ensure CEO is the primary root if it exists
        if (ceoNode && roots.length > 1) {
            const ceoRoot = userMap[ceoId];
            const otherRoots = roots.filter(r => r.id !== ceoId);
            ceoRoot.children.push(...otherRoots);
            return [ceoRoot];
        }

        return roots.filter(r => r.role_type === 'ceo' || roots.length === 1);
    }
}

module.exports = UserModel;