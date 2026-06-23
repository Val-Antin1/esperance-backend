const path = require('path');
const { validationResult } = require('express-validator');
const { getCollection } = require('../config/db');

const normalizePhotoUrl = (req, file) => {
  if (!file) return '';
  const filePath = file.path || file.url || '';
  if (filePath.startsWith('http')) return filePath;
  const filename = path.basename(filePath);
  const origin = `${req.protocol}://${req.get('host')}`;
  return `${origin}/uploads/${filename}`;
};

exports.createStaff = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const photo = normalizePhotoUrl(req, req.file);
  const staffCol = getCollection('staff');
  const staff = await staffCol.create({ ...req.body, photo });
  res.status(201).json({ success: true, message: 'Staff member created successfully', data: { staff } });
};

exports.getStaffMembers = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sort = req.query.sort || '-createdAt';
  const search = req.query.search;

  const staffCol = getCollection('staff');
  const filter = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { position: new RegExp(search, 'i') },
      { biography: new RegExp(search, 'i') },
    ];
  }

  const allStaff = staffCol.find(filter);
  const desc = sort.startsWith('-');
  const field = desc ? sort.substring(1) : sort;
  allStaff.sort((a, b) => {
    const aVal = a[field] || '';
    const bVal = b[field] || '';
    if (desc) return aVal < bVal ? 1 : -1;
    return aVal > bVal ? 1 : -1;
  });

  const total = allStaff.length;
  const staff = allStaff.slice((page - 1) * limit, page * limit);

  res.status(200).json({
    success: true,
    message: 'Staff members retrieved successfully',
    data: { staff, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
  });
};

exports.getStaffById = async (req, res) => {
  const staffCol = getCollection('staff');
  const staff = staffCol.findById(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }
  res.status(200).json({ success: true, message: 'Staff member retrieved successfully', data: { staff } });
};

exports.updateStaff = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const updatedData = { ...req.body };
  if (req.file) {
    updatedData.photo = normalizePhotoUrl(req, req.file);
  }

  const staffCol = getCollection('staff');
  const staff = staffCol.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });

  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }
  res.status(200).json({ success: true, message: 'Staff member updated successfully', data: { staff } });
};

exports.deleteStaff = async (req, res) => {
  const staffCol = getCollection('staff');
  const staff = staffCol.findByIdAndDelete(req.params.id);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Staff member not found' });
  }
  res.status(200).json({ success: true, message: 'Staff member removed successfully', data: {} });
};