const express = require('express');
const { body } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const {
  createNews,
  getNews,
  getNewsById,
  updateNews,
  deleteNews,
  publishNews,
} = require('../controllers/newsController');

const router = express.Router();
const allowedRoles = ['super_admin', 'admin'];

// Public routes - no authentication required
router.get('/', getNews);
router.get('/:id', getNewsById);

// Protected routes - require authentication
router.post(
  '/',
  protect,
  authorizeRoles(...allowedRoles),
  uploadSingle('image'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  createNews
);

router.put(
  '/:id',
  protect,
  authorizeRoles(...allowedRoles),
  uploadSingle('image'),
  [body('title').optional().notEmpty(), body('category').optional().notEmpty()],
  updateNews
);
router.delete('/:id', protect, authorizeRoles(...allowedRoles), deleteNews);
router.patch('/:id/publish', protect, authorizeRoles(...allowedRoles), publishNews);

module.exports = router;