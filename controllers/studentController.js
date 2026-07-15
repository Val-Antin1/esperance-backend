const { validationResult } = require('express-validator');
const Student = require('../models/Student');

const createFilter = ({ search, sport, status }) => {
  const filter = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { position: new RegExp(search, 'i') },
      { sport: new RegExp(search, 'i') },
      { gender: new RegExp(search, 'i') },
    ];
  }
  if (sport) {
    filter.sport = sport;
  }
  if (status) {
    filter.status = status;
  }
  return filter;
};

exports.createStudent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const profilePhoto = req.file?.url || '';
  
  try {
    const student = await Student.create({ ...req.body, profilePhoto });
    res.status(201).json({ success: true, message: 'Student created successfully', data: { student } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating student', error: error.message });
  }
};

exports.getStudents = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sort = req.query.sort || '-createdAt';
  const filter = createFilter(req.query);

  try {
    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: {
        students,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving students', error: error.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({ success: true, message: 'Student retrieved successfully', data: { student } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving student', error: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const updatedData = { ...req.body };
  if (req.file?.url) {
    updatedData.profilePhoto = req.file.url;
  }

  try {
    const student = await Student.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({ success: true, message: 'Student updated successfully', data: { student } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating student', error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({ success: true, message: 'Student removed successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting student', error: error.message });
  }
};