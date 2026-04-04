const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settingsController');
const AuthMiddleware = require('../middleware/authMiddleware');

// All settings routes require authentication
router.use(AuthMiddleware.verifyToken);

// Get all settings (Admin Only)
router.get('/', AuthMiddleware.isAdmin, SettingsController.getSettings);

// Get specific setting
router.get('/:key', SettingsController.getSetting);

// Update or Create setting (Admin Or HR)
router.post('/update', AuthMiddleware.isHR, SettingsController.updateSetting);

module.exports = router;
