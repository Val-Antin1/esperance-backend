const cloudinary = require('cloudinary').v2;

// Log Cloudinary configuration (without exposing secrets)
console.log('☁️  Cloudinary Configuration:');
console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
console.log('   API Key:', process.env.CLOUDINARY_API_KEY ? '***SET***' : 'NOT SET');
console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET ? '***SET***' : 'NOT SET');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ WARNING: Cloudinary environment variables are not fully configured!');
  console.error('   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
} else {
  console.log('✅ Cloudinary configured successfully');
}

module.exports = { cloudinary };
