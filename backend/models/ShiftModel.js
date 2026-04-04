const { pool } = require('../config/database');

class ShiftModel {
    // Create a new shift
    static async create(shiftData) {
        const { name, start_time, end_time } = shiftData;
        const [result] = await pool.query(
            'INSERT INTO shifts (name, start_time, end_time) VALUES (?, ?, ?)',
            [name, start_time, end_time]
        );
        return result.insertId;
    }

    // Get all shifts
    static async getAll() {
        const [rows] = await pool.query('SELECT * FROM shifts ORDER BY name ASC');
        return rows;
    }

    // Find shift by ID
    static async findById(id) {
        const [rows] = await pool.query('SELECT * FROM shifts WHERE id = ?', [id]);
        return rows[0];
    }

    // Update shift
    static async update(id, shiftData) {
        const { name, start_time, end_time } = shiftData;
        const [result] = await pool.query(
            'UPDATE shifts SET name = ?, start_time = ?, end_time = ? WHERE id = ?',
            [name, start_time, end_time, id]
        );
        return result.affectedRows > 0;
    }

    // Delete shift
    static async delete(id) {
        const [result] = await pool.query('DELETE FROM shifts WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = ShiftModel;
