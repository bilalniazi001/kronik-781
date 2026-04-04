const { pool } = require('../config/database');

class BreakRequestModel {
    static async create(data) {
        const { employee_id, manager_id, date, start_time, end_time, duration_hours, reason } = data;
        const [result] = await pool.query(
            `INSERT INTO break_requests (employee_id, manager_id, date, start_time, end_time, duration_hours, reason, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [employee_id, manager_id, date, start_time || null, end_time || null, duration_hours || null, reason]
        );
        return result.insertId;
    }

    static async findById(id) {
        const [rows] = await pool.query(
            `SELECT br.*, u.name as employee_name, m.name as manager_name
             FROM break_requests br
             JOIN users u ON br.employee_id = u.id
             LEFT JOIN users m ON br.manager_id = m.id
             WHERE br.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async updateStatus(id, status) {
        const [result] = await pool.query(
            'UPDATE break_requests SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async getByEmployee(employee_id) {
        const [rows] = await pool.query(
            'SELECT * FROM break_requests WHERE employee_id = ? ORDER BY date DESC, applied_at DESC',
            [employee_id]
        );
        return rows;
    }

    static async getPendingForManager(manager_id) {
        const [rows] = await pool.query(
            `SELECT br.*, u.name as employee_name, u.designation
             FROM break_requests br
             JOIN users u ON br.employee_id = u.id
             WHERE br.manager_id = ? AND br.status = 'pending'
             ORDER BY br.applied_at DESC`,
            [manager_id]
        );
        return rows;
    }

    static async getApprovedForToday(employee_id, date) {
        const [rows] = await pool.query(
            'SELECT * FROM break_requests WHERE employee_id = ? AND date = ? AND status = "approved"',
            [employee_id, date]
        );
        return rows;
    }
}

module.exports = BreakRequestModel;
