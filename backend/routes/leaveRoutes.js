const express = require('express');
const router = express.Router();
const LeaveController = require('../controllers/leaveController');
const AuthMiddleware = require('../middleware/authMiddleware');

router.use(AuthMiddleware.verifyToken);

// Employee routes
router.post('/apply', LeaveController.applyLeave);
router.get('/my-leaves', LeaveController.getMyLeaves);
router.get('/my-balances', LeaveController.getMyBalances);
// Public routes (authenticated)
router.get('/holidays', LeaveController.getHolidays);
router.delete('/cancel/:id', LeaveController.cancelLeave);

// Manager routes
router.get('/manager/pending', AuthMiddleware.isManager, LeaveController.getManagerPending);
router.get('/manager/history', AuthMiddleware.isManager, LeaveController.getManagerHistory);
router.post('/manager/action/:id', AuthMiddleware.isManager, LeaveController.managerAction);

// HR routes
router.get('/hr/pending', AuthMiddleware.isHR, LeaveController.getHRPending);
router.get('/hr/history', AuthMiddleware.isHR, LeaveController.getHRHistory);
router.post('/hr/action/:id', AuthMiddleware.isHR, LeaveController.hrAction);

// CEO routes
router.get('/ceo/pending', AuthMiddleware.isCEO, LeaveController.getCEOPending);
router.get('/ceo/history', AuthMiddleware.isCEO, LeaveController.getCEOHistory);
router.post('/ceo/action/:id', AuthMiddleware.isCEO, LeaveController.ceoAction);

module.exports = router;
