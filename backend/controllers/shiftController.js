const ShiftModel = require('../models/ShiftModel');
const UserModel = require('../models/UserModel');

class ShiftController {
    // Get all shifts
    static async getAllShifts(req, res, next) {
        try {
            const shifts = await ShiftModel.getAll();
            res.json({ success: true, data: shifts });
        } catch (error) {
            next(error);
        }
    }

    // Create a shift
    static async createShift(req, res, next) {
        try {
            const { name, start_time, end_time } = req.body;
            const shiftId = await ShiftModel.create({ name, start_time, end_time });
            res.json({ success: true, message: 'Shift created successfully', id: shiftId });
        } catch (error) {
            next(error);
        }
    }

    // Update a shift
    static async updateShift(req, res, next) {
        try {
            const { id } = req.params;
            const { name, start_time, end_time } = req.body;
            await ShiftModel.update(id, { name, start_time, end_time });
            res.json({ success: true, message: 'Shift updated successfully' });
        } catch (error) {
            next(error);
        }
    }

    // Delete a shift
    static async deleteShift(req, res, next) {
        try {
            const { id } = req.params;
            await ShiftModel.delete(id);
            res.json({ success: true, message: 'Shift deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    // Assign shift to user
    static async assignShift(req, res, next) {
        try {
            const { userId, shiftId } = req.body;
            await UserModel.update(userId, { shift_id: shiftId });
            res.json({ success: true, message: 'Shift assigned successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ShiftController;
