const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getStats } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/stats', protect, authorizeRoles('super_admin', 'admin', 'manager', 'coach'), getStats);

module.exports = router;
