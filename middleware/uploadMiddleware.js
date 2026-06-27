const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'esperancefc',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image uploads are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter: imageFilter });

const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadFields = (fields) => upload.fields(fields);

module.exports = { uploadSingle, uploadFields };