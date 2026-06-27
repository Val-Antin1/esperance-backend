const { validationResult } = require('express-validator');
const Sport = require('../models/Sport');

exports.createSport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const bannerImage = req.file?.url || '';
  
  try {
    const sport = await Sport.create({ ...req.body, bannerImage });
    res.status(201).json({ success: true, message: 'Sport created successfully', data: { sport } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating sport', error: error.message });
  }
};

exports.getSports = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sort = req.query.sort || '-createdAt';
  const search = req.query.search;

  const filter = {};
  if (search) {
    filter.name = new RegExp(search, 'i');
  }

  try {
    const total = await Sport.countDocuments(filter);
    const sports = await Sport.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Sports retrieved successfully',
      data: { sports, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving sports', error: error.message });
  }
};

exports.getSportById = async (req, res) => {
  try {
    const sport = await Sport.findById(req.params.id);
    if (!sport) {
      return res.status(404).json({ success: false, message: 'Sport not found' });
    }
    res.status(200).json({ success: true, message: 'Sport retrieved successfully', data: { sport } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving sport', error: error.message });
  }
};

exports.updateSport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const updatedData = { ...req.body };
  if (req.file?.url) {
    updatedData.bannerImage = req.file.url;
  }

  try {
    const sport = await Sport.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
    if (!sport) {
      return res.status(404).json({ success: false, message: 'Sport not found' });
    }
    res.status(200).json({ success: true, message: 'Sport updated successfully', data: { sport } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating sport', error: error.message });
  }
};

exports.deleteSport = async (req, res) => {
  try {
    const sport = await Sport.findByIdAndDelete(req.params.id);
    if (!sport) {
      return res.status(404).json({ success: false, message: 'Sport not found' });
    }
    res.status(200).json({ success: true, message: 'Sport removed successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting sport', error: error.message });
  }
};