const express = require('express');
const router = express.Router();
const BreakController = require('../controllers/breakController');
const AuthMiddleware = require('../middleware/authMiddleware');

router.use(AuthMiddleware.verifyToken);

router.post('/apply', BreakController.applyBreak);
router.get('/my-requests', BreakController.getMyBreaks);
router.get('/pending', BreakController.getPendingBreaks);
router.post('/action/:id', BreakController.managerAction);

module.exports = router;
