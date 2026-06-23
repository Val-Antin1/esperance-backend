const express = require('express');
const { body } = require('express-validator');
const { protect, optionalProtect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const {
  createGalleryItem,
  getGalleryItems,
  getGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} = require('../controllers/galleryController');

const router = express.Router();
const allowedRoles = ['super_admin', 'admin'];

// Public routes - no authentication required
router.get('/', getGalleryItems);
router.get('/:id', getGalleryItem);

// Protected routes - require authentication
router.post(
  '/',
  protect,
  authorizeRoles(...allowedRoles),
  uploadSingle('image'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('category')
      .isIn(['Football', "Women's Football", 'Basketball', 'Volleyball', 'Table Tennis', 'German Classes', 'Events'])
      .withMessage('Valid category is required'),
  ],
  createGalleryItem
);

router.put(
  '/:id',
  protect,
  authorizeRoles(...allowedRoles),
  uploadSingle('image'),
  [body('category').optional().isIn(['Football', "Women's Football", 'Basketball', 'Volleyball', 'Table Tennis', 'German Classes', 'Events'])],
  updateGalleryItem
);
router.delete('/:id', protect, authorizeRoles(...allowedRoles), deleteGalleryItem);

module.exports = router;