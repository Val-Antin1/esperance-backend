const { getCollection } = require('../config/db');

exports.getStats = async (req, res) => {
  const totalStudents = getCollection('students').countDocuments();
  const totalStaff = getCollection('staff').countDocuments();
  const totalGalleryImages = getCollection('gallery').countDocuments();
  const totalNews = getCollection('news').countDocuments();

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
};