const express = require('express');
const { body } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const {
  createStaff,
  getStaffMembers,
  getStaffById,
  updateStaff,
  deleteStaff,
} = require('../controllers/staffController');

const router = express.Router();
const allowedRoles = ['super_admin', 'admin', 'manager'];

router.post(
  '/',
  protect,
  authorizeRoles(...allowedRoles),
  uploadSingle('photo'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('position').notEmpty().withMessage('Position is required'),
  ],
  createStaff
);

router.get('/', getStaffMembers);
router.get('/:id', protect, authorizeRoles(...allowedRoles), getStaffById);
router.put(
  '/:id',
  protect,
  authorizeRoles(...allowedRoles),
  uploadSingle('photo'),
  [body('age').optional().isInt({ min: 1 })],
  updateStaff
);
router.delete('/:id', protect, authorizeRoles(...allowedRoles), deleteStaff);

module.exports = router;
