const { validationResult } = require('express-validator');
const { getCollection } = require('../config/db');

const createFilter = ({ search, sport, status }) => {
  const filter = {};
  if (search) {
    filter.$or = [
      { fullName: new RegExp(search, 'i') },
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

  const profilePhoto = req.file?.path || '';
  const studentsCol = getCollection('students');
  const student = await studentsCol.create({ ...req.body, profilePhoto });

  res.status(201).json({ success: true, message: 'Student created successfully', data: { student } });
};

exports.getStudents = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sort = req.query.sort || '-createdAt';
  const filter = createFilter(req.query);
  
  const studentsCol = getCollection('students');
  const allStudents = studentsCol.find(filter);
  
  // Sort
  const desc = sort.startsWith('-');
  const field = desc ? sort.substring(1) : sort;
  allStudents.sort((a, b) => {
    const aVal = a[field] || '';
    const bVal = b[field] || '';
    if (desc) return aVal < bVal ? 1 : -1;
    return aVal > bVal ? 1 : -1;
  });
  
  const total = allStudents.length;
  const students = allStudents.slice((page - 1) * limit, page * limit);

  res.status(200).json({
    success: true,
    message: 'Students retrieved successfully',
    data: {
      students,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    },
  });
};

exports.getStudentById = async (req, res) => {
  const studentsCol = getCollection('students');
  const student = studentsCol.findById(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  res.status(200).json({ success: true, message: 'Student retrieved successfully', data: { student } });
};

exports.updateStudent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const updatedData = { ...req.body };
  if (req.file?.path) {
    updatedData.profilePhoto = req.file.path;
  }

  const studentsCol = getCollection('students');
  const student = studentsCol.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });

  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  res.status(200).json({ success: true, message: 'Student updated successfully', data: { student } });
};

exports.deleteStudent = async (req, res) => {
  const studentsCol = getCollection('students');
  const student = studentsCol.findByIdAndDelete(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  res.status(200).json({ success: true, message: 'Student removed successfully', data: {} });
};