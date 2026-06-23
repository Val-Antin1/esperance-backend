const mongoose = require('mongoose');

const websiteSettingsSchema = new mongoose.Schema(
  {
    academyName: { type: String, trim: true },
    logo: { type: String, trim: true },
    heroBanner: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    youtube: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    academyDescription: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WebsiteSettings', websiteSettingsSchema);
