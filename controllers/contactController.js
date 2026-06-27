const { validationResult } = require('express-validator');
const ContactMessage = require('../models/ContactMessage');

exports.submitMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  try {
    const message = await ContactMessage.create(req.body);
    res.status(201).json({ success: true, message: 'Message submitted successfully', data: { message } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting message', error: error.message });
  }
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

  try {
    const total = await ContactMessage.countDocuments(filter);
    const messages = await ContactMessage.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Contact messages retrieved successfully',
      data: { messages, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving messages', error: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.status(200).json({ success: true, message: 'Message deleted successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting message', error: error.message });
  }
};