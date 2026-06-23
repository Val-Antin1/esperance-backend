const express = require('express');
const { body } = require('express-validator');
const { login, getMe, createAdmin } = require('../controllers/authController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  login
);

router.post(
  '/create-admin',
  optionalProtect,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  createAdmin
);

router.get('/me', protect, getMe);

module.exports = router;
