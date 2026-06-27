const { validationResult } = require('express-validator');
const Staff = require('../models/Staff');

const createStaff = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const photo = req.file ? req.file.url : '';
  const staffCol = await Staff.create({ ...req.body, photo });
  res.status(201).json({ success: true, message: 'Staff member created successfully', data: { staff: staffCol } });
};

const getStaffMembers = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sort = req.query.sort || '-createdAt';
  const search = req.query.search;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { position: new RegExp(search, 'i') },
      { biography: new RegExp(search, 'i') },
    ];
  }

  try {
    const total = await Staff.countDocuments(filter);
    const staff = await Staff.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Staff members retrieved successfully',
      data: { staff, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving staff members', error: error.message });
  }
};

const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.status(200).json({ success: true, message: 'Staff member retrieved successfully', data: { staff } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving staff member', error: error.message });
  }
};

const updateStaff = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const updatedData = { ...req.body };
  if (req.file) {
    updatedData.photo = req.file.url;
  }

  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.status(200).json({ success: true, message: 'Staff member updated successfully', data: { staff } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating staff member', error: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    res.status(200).json({ success: true, message: 'Staff member removed successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting staff member', error: error.message });
  }
};

module.exports = {
  createStaff,
  getStaffMembers,
  getStaffById,
  updateStaff,
  deleteStaff,
};