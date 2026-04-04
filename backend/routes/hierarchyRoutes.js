const express = require('express');
const router = express.Router();
const HierarchyController = require('../controllers/hierarchyController');
const AuthMiddleware = require('../middleware/authMiddleware');

// All hierarchy routes require authentication
router.use(AuthMiddleware.verifyToken);

router.get('/tree', HierarchyController.getOrganizationTree);

module.exports = router;
