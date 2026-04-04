const express = require('express');
const router = express.Router();
const ShiftController = require('../controllers/shiftController');
const AuthMiddleware = require('../middleware/authMiddleware');

// Get all shifts
router.get('/', AuthMiddleware.verifyToken, ShiftController.getAllShifts);

// Create a shift (Admin/HR only)
router.post('/', AuthMiddleware.verifyToken, AuthMiddleware.isHR, ShiftController.createShift);

// Assign a shift to a user (Admin/HR only)
router.post('/assign', AuthMiddleware.verifyToken, AuthMiddleware.isHR, ShiftController.assignShift);

// Update a shift (Admin/HR only)
router.put('/:id', AuthMiddleware.verifyToken, AuthMiddleware.isHR, ShiftController.updateShift);

// Delete a shift (Admin/HR only)
router.delete('/:id', AuthMiddleware.verifyToken, AuthMiddleware.isHR, ShiftController.deleteShift);

module.exports = router;
