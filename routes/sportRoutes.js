const express = require('express');
const { body } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const {
  createSport,
  getSports,
  getSportById,
  updateSport,
  deleteSport,
} = require('../controllers/sportController');

const router = express.Router();

const allowedRoles = ['super_admin', 'admin', 'manager'];

// Public routes - no authentication required
router.get('/', getSports);
router.get('/:id', getSportById);

// Protected routes - require authentication
router.post(
  '/',
  protect,
  authorizeRoles(...allowedRoles),
  uploadSingle('bannerImage'),
  [body('name').notEmpty().withMessage('Sport name is required')],
  createSport
);

router.put(
  '/:id',
  protect,
  authorizeRoles(...allowedRoles),
  uploadSingle('bannerImage'),
  [body('name').optional().notEmpty()],
  updateSport
);
router.delete('/:id', protect, authorizeRoles(...allowedRoles), deleteSport);

module.exports = router;