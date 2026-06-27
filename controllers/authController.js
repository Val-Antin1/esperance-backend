const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = createToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: formatUser(user),
    },
  });
};

exports.getMe = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  res.status(200).json({ success: true, message: 'Current user fetched', data: { user: formatUser(req.user) } });
};

exports.createAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const { name, email, password, role = 'admin' } = req.body;
  const existingUsers = await User.countDocuments();

  if (existingUsers === 0) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, password: hashedPassword, role: 'super_admin' });
    return res.status(201).json({ success: true, message: 'Super admin created', data: { user: formatUser(user) } });
  }

  if (!req.user || req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: only super admin can create admins' });
  }

  const allowedRoles = ['admin', 'manager', 'coach'];
  const normalizedRole = allowedRoles.includes(role) ? role : 'admin';

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Email already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await User.create({ name, email, password: hashedPassword, role: normalizedRole });
  res.status(201).json({ success: true, message: 'Admin user created', data: { user: formatUser(user) } });
};