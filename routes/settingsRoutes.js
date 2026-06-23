const express = require('express');
const { body } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadFields } = require('../middleware/uploadMiddleware');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();

// Public route - anyone can view website settings
router.get('/', getSettings);

// Protected route - only admins can update settings
router.put(
  '/',
  protect,
  authorizeRoles('super_admin', 'admin'),
  uploadFields([
    { name: 'logo', maxCount: 1 },
    { name: 'heroBanner', maxCount: 1 },
  ]),
  [
    body('academyName').optional().notEmpty(),
    body('phone').optional().notEmpty(),
    body('email').optional().isEmail(),
  ],
  updateSettings
);

module.exports = router;