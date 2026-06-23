const { validationResult } = require('express-validator');
const { getCollection } = require('../config/db');

exports.createSport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const bannerImage = req.file?.path || '';
  const sportsCol = getCollection('sports');
  const sport = await sportsCol.create({ ...req.body, bannerImage });
  res.status(201).json({ success: true, message: 'Sport created successfully', data: { sport } });
};

exports.getSports = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sort = req.query.sort || '-createdAt';
  const search = req.query.search;

  const sportsCol = getCollection('sports');
  const filter = {};
  if (search) {
    filter.name = new RegExp(search, 'i');
  }

  const allSports = sportsCol.find(filter);
  const desc = sort.startsWith('-');
  const field = desc ? sort.substring(1) : sort;
  allSports.sort((a, b) => {
    const aVal = a[field] || '';
    const bVal = b[field] || '';
    if (desc) return aVal < bVal ? 1 : -1;
    return aVal > bVal ? 1 : -1;
  });

  const total = allSports.length;
  const sports = allSports.slice((page - 1) * limit, page * limit);

  res.status(200).json({
    success: true,
    message: 'Sports retrieved successfully',
    data: { sports, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
  });
};

exports.getSportById = async (req, res) => {
  const sportsCol = getCollection('sports');
  const sport = sportsCol.findById(req.params.id);
  if (!sport) {
    return res.status(404).json({ success: false, message: 'Sport not found' });
  }
  res.status(200).json({ success: true, message: 'Sport retrieved successfully', data: { sport } });
};

exports.updateSport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const updatedData = { ...req.body };
  if (req.file?.path) updatedData.bannerImage = req.file.path;

  const sportsCol = getCollection('sports');
  const sport = sportsCol.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
  if (!sport) {
    return res.status(404).json({ success: false, message: 'Sport not found' });
  }
  res.status(200).json({ success: true, message: 'Sport updated successfully', data: { sport } });
};

exports.deleteSport = async (req, res) => {
  const sportsCol = getCollection('sports');
  const sport = sportsCol.findByIdAndDelete(req.params.id);
  if (!sport) {
    return res.status(404).json({ success: false, message: 'Sport not found' });
  }
  res.status(200).json({ success: true, message: 'Sport removed successfully', data: {} });
};