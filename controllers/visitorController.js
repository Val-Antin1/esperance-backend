const WebsiteSettings = require('../models/WebsiteSettings');

exports.recordVisitor = async (req, res) => {
  try {
    const settings = await WebsiteSettings.findOne();

    if (settings) {
      settings.visitorCount = (settings.visitorCount || 0) + 1;
      await settings.save();
    } else {
      await WebsiteSettings.create({ visitorCount: 1 });
    }

    res.status(200).json({ success: true, message: 'Visitor counted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to count visitor', error: error.message });
  }
};