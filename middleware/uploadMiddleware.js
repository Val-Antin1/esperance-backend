const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');

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

const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const getUploadUrl = (req, filePath) => {
  if (!filePath) return null;

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  const apiPath = normalizedPath.startsWith('/uploads/')
    ? normalizedPath.replace('/uploads/', '/api/uploads/')
    : normalizedPath;

  const baseUrl = process.env.BACKEND_URL || process.env.PUBLIC_URL;
  if (baseUrl) {
    const normalizedBase = baseUrl.replace(/\/$/, '');
    return `${normalizedBase}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
  }

  const host = req.get('host');
  const protocol = req.protocol || 'http';
  return `${protocol}://${host}${apiPath}`;
};

const uploadSingle = (fieldName, options = {}) => {
  const { optional = false } = options;

  return async (req, res, next) => {
    console.log(`🔍 Upload middleware called for field: ${fieldName}`);
    console.log(`   Content-Type: ${req.headers['content-type']}`);

    upload.single(fieldName)(req, res, async (err) => {
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

      try {
        let finalUrl = getUploadUrl(req, `/uploads/${req.file.filename}`);

        if (useCloudinary) {
          try {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
              resource_type: 'auto',
              folder: 'esperance-academy',
              public_id: path.basename(req.file.filename, path.extname(req.file.filename)),
              overwrite: true,
            });
            finalUrl = uploadResult.secure_url;
            console.log('☁️ Uploaded to Cloudinary:', finalUrl);
          } catch (cloudErr) {
            console.error('⚠️ Cloudinary upload failed, falling back to local storage:', cloudErr.message);
          }
        }

        if (useCloudinary && fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupErr) {
            console.warn('Could not delete temp upload:', cleanupErr.message);
          }
        }

        req.file.url = finalUrl;
        req.file.type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

        console.log('✅ File upload successful:', {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          url: req.file.url,
        });

        next();
      } catch (processingErr) {
        console.error('❌ File processing error:', processingErr);
        return res.status(500).json({ success: false, message: 'Image upload processing failed' });
      }
    });
  };
};

const uploadFields = (fields) => upload.fields(fields);

module.exports = { uploadSingle, uploadFields };