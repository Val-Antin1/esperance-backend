const express = require('express');
const { body } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { submitMessage, getMessages, deleteMessage } = require('../controllers/contactController');

const router = express.Router();

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  submitMessage
);

router.get('/', protect, authorizeRoles('super_admin', 'admin'), getMessages);
router.delete('/:id', protect, authorizeRoles('super_admin', 'admin'), deleteMessage);

module.exports = router;
