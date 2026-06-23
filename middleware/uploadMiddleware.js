const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if Cloudinary is configured with real credentials
const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && cloudName !== 'YOUR_CLOUD_NAME' && 
         apiKey && apiKey !== 'YOUR_KEY' && 
         apiSecret && apiSecret !== 'YOUR_SECRET';
};

let upload;

if (isCloudinaryConfigured()) {
  // Use Cloudinary storage if configured
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

  upload = multer({ storage, fileFilter: imageFilter });
} else {
  // Fallback to local disk storage if Cloudinary not configured
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image uploads are allowed'), false);
    }
  };

  upload = multer({ storage, fileFilter: imageFilter });
}

const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadFields = (fields) => upload.fields(fields);

module.exports = { uploadSingle, uploadFields };