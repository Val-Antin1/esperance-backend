const { validationResult } = require('express-validator');
const WebsiteSettings = require('../models/WebsiteSettings');

exports.getSettings = async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = {};
    }
    res.status(200).json({ success: true, message: 'Website settings retrieved successfully', data: { settings } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving settings', error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const updateData = { ...req.body };
  if (req.files?.logo?.[0]?.url) {
    updateData.logo = req.files.logo[0].url;
  }
  if (req.files?.heroBanner?.[0]?.url) {
    updateData.heroBanner = req.files.heroBanner[0].url;
  }

  try {
    const existing = await WebsiteSettings.findOne();
    if (existing) {
      const settings = await WebsiteSettings.findByIdAndUpdate(existing._id, updateData, { new: true, runValidators: true });
      res.status(200).json({ success: true, message: 'Website settings updated successfully', data: { settings } });
    } else {
      const settings = await WebsiteSettings.create(updateData);
      res.status(200).json({ success: true, message: 'Website settings updated successfully', data: { settings } });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating settings', error: error.message });
  }
};