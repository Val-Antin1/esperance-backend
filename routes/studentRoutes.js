const express = require('express');
const { body } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');

const router = express.Router();

const canManageStudents = ['super_admin', 'admin', 'manager'];
const canViewStudents = ['super_admin', 'admin', 'manager', 'coach'];

router.post(
  '/',
  protect,
  authorizeRoles(...canManageStudents),
  uploadSingle('profilePhoto'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('position').notEmpty().withMessage('Position is required'),
    body('age').isInt({ min: 1 }).withMessage('Age must be a valid number'),
    body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
    body('sport')
      .isIn(['Football', "Women's Football", 'Basketball', 'Volleyball', 'Table Tennis'])
      .withMessage('Sport must be one of the supported categories'),
  ],
  createStudent
);

router.get('/', getStudents);
router.get('/:id', getStudentById);
router.put(
  '/:id',
  protect,
  authorizeRoles(...canViewStudents),
  uploadSingle('profilePhoto', { optional: true }),
  [
    body('name').optional({ checkFalsy: true }).notEmpty().withMessage('Name is required'),
    body('position').optional({ checkFalsy: true }).notEmpty().withMessage('Position is required'),
    body('age').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Age must be a valid number'),
    body('gender').optional({ checkFalsy: true }).isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
    body('sport')
      .optional({ checkFalsy: true })
      .isIn(['Football', "Women's Football", 'Basketball', 'Volleyball', 'Table Tennis'])
      .withMessage('Sport must be one of the supported categories'),
  ],
  updateStudent
);
router.delete('/:id', protect, authorizeRoles(...canManageStudents), deleteStudent);

module.exports = router;
