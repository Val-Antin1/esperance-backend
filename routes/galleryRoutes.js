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
  bulkDeleteGalleryItems,
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
  createGalleryItem
);

router.put(
  '/:id',
  protect,
  authorizeRoles(...allowedRoles),
  uploadSingle('image', { optional: true }),
  updateGalleryItem
);
router.delete('/:id', protect, authorizeRoles(...allowedRoles), deleteGalleryItem);
router.delete('/', protect, authorizeRoles(...allowedRoles), bulkDeleteGalleryItems);

module.exports = router;
