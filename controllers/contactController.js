const { validationResult } = require('express-validator');
const { getCollection } = require('../config/db');

exports.submitMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const contactCol = getCollection('contactMessages');
  const message = await contactCol.create(req.body);
  res.status(201).json({ success: true, message: 'Message submitted successfully', data: { message } });
};

exports.getMessages = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sort = req.query.sort || '-createdAt';
  const search = req.query.search;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { subject: new RegExp(search, 'i') },
      { message: new RegExp(search, 'i') },
    ];
  }

  const contactCol = getCollection('contactMessages');
  const allMessages = contactCol.find(filter);
  const desc = sort.startsWith('-');
  const field = desc ? sort.substring(1) : sort;
  allMessages.sort((a, b) => {
    const aVal = a[field] || '';
    const bVal = b[field] || '';
    if (desc) return aVal < bVal ? 1 : -1;
    return aVal > bVal ? 1 : -1;
  });

  const total = allMessages.length;
  const messages = allMessages.slice((page - 1) * limit, page * limit);

  res.status(200).json({
    success: true,
    message: 'Contact messages retrieved successfully',
    data: { messages, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
  });
};

exports.deleteMessage = async (req, res) => {
  const contactCol = getCollection('contactMessages');
  const message = contactCol.findByIdAndDelete(req.params.id);
  if (!message) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }
  res.status(200).json({ success: true, message: 'Message deleted successfully', data: {} });
};