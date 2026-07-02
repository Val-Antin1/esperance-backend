const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image uploads are allowed'), false);
  }
};

const memoryStorage = multer.memoryStorage();
const upload = multer({ 
  storage: memoryStorage, 
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const uploadToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'esperancefc',
        resource_type: 'image',
        public_id: filename?.replace(/\.[^/.]+$/, ''),
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

const uploadSingle = (fieldName, options = {}) => {
  const { optional = false } = options;

  return async (req, res, next) => {
    console.log(`🔍 Upload middleware called for field: ${fieldName}`);
    console.log(`   Content-Type: ${req.headers['content-type']}`);

    if (!isCloudinaryConfigured()) {
      console.error('❌ Cloudinary is not configured. Missing env vars.');
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      });
    }

    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        console.error('❌ Multer error:', err);
        return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
      }

      if (!req.file || !req.file.buffer) {
        if (optional) {
          console.log(`ℹ️ Optional upload field '${fieldName}' was not provided.`);
          return next();
        }

        console.error('❌ No file was uploaded or Multer did not parse the file.');
        return res.status(400).json({
          success: false,
          message: 'Image upload failed. Please ensure Cloudinary is configured correctly and the request includes a valid image file.',
        });
      }

      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
        req.file.url = result.secure_url || result.url;
        req.file.public_id = result.public_id;
        req.file.cloudinaryResult = result;

        console.log('✅ Cloudinary upload successful:', {
          originalname: req.file.originalname,
          url: req.file.url,
          public_id: req.file.public_id,
        });

        next();
      } catch (uploadError) {
        console.error('❌ Cloudinary upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Image upload failed. Please ensure Cloudinary is configured correctly.',
          error: uploadError.message,
        });
      }
    });
  };
};

const uploadFields = (fields) => upload.fields(fields);

module.exports = { uploadSingle, uploadFields };