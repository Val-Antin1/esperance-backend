const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Gallery = require('../models/Gallery');
const News = require('../models/News');
const WebsiteSettings = require('../models/WebsiteSettings');

exports.getStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalStaff = await Staff.countDocuments();
    const totalGalleryImages = await Gallery.countDocuments();
    const totalNews = await News.countDocuments();
    const websiteSettings = await WebsiteSettings.findOne();
    const visitorCount = websiteSettings?.visitorCount || 0;

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        totalStudents,
        totalStaff,
        totalGalleryImages,
        totalNews,
        visitorCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving dashboard statistics', error: error.message });
  }
};