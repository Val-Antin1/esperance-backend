const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Gallery = require('../models/Gallery');
const News = require('../models/News');

exports.getStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalStaff = await Staff.countDocuments();
    const totalGalleryImages = await Gallery.countDocuments();
    const totalNews = await News.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        totalStudents,
        totalStaff,
        totalGalleryImages,
        totalNews,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving dashboard statistics', error: error.message });
  }
};