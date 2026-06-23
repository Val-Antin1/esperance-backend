const { validationResult } = require('express-validator');
const { getCollection } = require('../config/db');

exports.getSettings = async (req, res) => {
  const settingsCol = getCollection('websiteSettings');
  let settings = settingsCol.findOne();
  if (!settings) {
    settings = {};
  }
  res.status(200).json({ success: true, message: 'Website settings retrieved successfully', data: { settings } });
};

exports.updateSettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const updateData = { ...req.body };
  if (req.files?.logo?.[0]?.path) {
    updateData.logo = req.files.logo[0].path;
  }
  if (req.files?.heroBanner?.[0]?.path) {
    updateData.heroBanner = req.files.heroBanner[0].path;
  }

  const settingsCol = getCollection('websiteSettings');
  const existing = settingsCol.findOne();
  if (existing) {
    const settings = settingsCol.findByIdAndUpdate(existing._id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Website settings updated successfully', data: { settings } });
  } else {
    const settings = await settingsCol.create(updateData);
    res.status(200).json({ success: true, message: 'Website settings updated successfully', data: { settings } });
  }
};