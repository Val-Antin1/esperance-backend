const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

console.log('☁️  Cloudinary config:', {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY ? '***' : 'NOT SET'
});

// Use memory storage as fallback to debug
const memoryStorage = multer.memoryStorage();
const cloudinaryStorage = new CloudinaryStorage({
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

// Try Cloudinary first, fallback to memory storage for debugging
let upload;
try {
  upload = multer({ 
    storage: cloudinaryStorage, 
    fileFilter: imageFilter,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });
  console.log('✅ Using Cloudinary storage');
} catch (error) {
  console.error('❌ Cloudinary storage failed, using memory storage:', error);
  upload = multer({ 
    storage: memoryStorage, 
    fileFilter: imageFilter,
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  });
}

const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    console.log(`🔍 Upload middleware called for field: ${fieldName}`);
    console.log(`   Content-Type: ${req.headers['content-type']}`);
    
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        console.error('❌ Multer error:', err);
        return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
      }
      
      console.log('📦 After multer - req.file:', req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: req.file.url
      } : 'undefined');
      
      if (!req.file) {
        console.error('❌ CRITICAL: req.file is undefined after multer');
        console.error('   This indicates Cloudinary upload failed or credentials are invalid');
        console.error('   Check Cloudinary configuration in backend logs');
        
        return res.status(400).json({ 
          success: false, 
          message: 'Image upload failed. Please ensure Cloudinary is configured correctly.' 
        });
      }
      
      console.log('✅ Upload successful:', req.file.filename);
      next();
    });
  };
};

const uploadFields = (fields) => upload.fields(fields);

module.exports = { uploadSingle, uploadFields };