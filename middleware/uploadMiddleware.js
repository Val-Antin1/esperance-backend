const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video uploads are allowed'), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || '';
    const safeName = path.basename(file.originalname, extension).replace(/\s+/g, '-').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}${extension}`);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

const uploadSingle = (fieldName, options = {}) => {
  const { optional = false } = options;

  return async (req, res, next) => {
    console.log(`🔍 Upload middleware called for field: ${fieldName}`);
    console.log(`   Content-Type: ${req.headers['content-type']}`);

    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        console.error('❌ Multer error:', err);
        return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
      }

      if (!req.file) {
        if (optional) {
          console.log(`ℹ️ Optional upload field '${fieldName}' was not provided.`);
          return next();
        }

        console.error('❌ No file was uploaded or Multer did not parse the file.');
        return res.status(400).json({
          success: false,
          message: 'Media upload failed. Please ensure the request includes a valid image or video file.',
        });
      }

      req.file.url = `/uploads/${req.file.filename}`;
      req.file.type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

      console.log('✅ File upload successful:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        url: req.file.url,
      });

      next();
    });
  };
};

const uploadFields = (fields) => upload.fields(fields);

module.exports = { uploadSingle, uploadFields };