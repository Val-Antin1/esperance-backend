const path = require('path');
const { validationResult } = require('express-validator');
const { getCollection } = require('../config/db');

const normalizeImageUrl = (req, file) => {
  if (!file) return null;
  const filePath = file.path || file.url || '';
  
  // If it's already a full URL (e.g., from Cloudinary), return as is
  if (filePath.startsWith('http')) return filePath;
  
  const filename = path.basename(filePath);
  
  // Use BACKEND_URL from environment if available, otherwise fall back to request host
  const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  
  return `${backendUrl}/uploads/${filename}`;
};

exports.createGalleryItem = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const imageUrl = normalizeImageUrl(req, req.file);
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'Image upload is required' });
  }

  const galleryCol = getCollection('gallery');
  
  // Check storage capacity before creating
  const currentCount = galleryCol.countDocuments();
  const MAX_STORAGE = 300;
  if (currentCount >= MAX_STORAGE) {
    return res.status(400).json({ 
      success: false, 
      message: `The storage is full! Maximum capacity of ${MAX_STORAGE} images reached. Please delete some images before uploading new ones.` 
    });
  }

  const item = await galleryCol.create({ ...req.body, imageUrl });
  res.status(201).json({ success: true, message: 'Gallery item created successfully', data: { gallery: item } });
};

exports.getGalleryItems = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 0; // 0 means no limit, return all
  const sort = req.query.sort || '-createdAt';
  const search = req.query.search;
  const category = req.query.category;

  const filter = {};
  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { category: new RegExp(search, 'i') },
    ];
  }
  if (category) filter.category = category;

  const galleryCol = getCollection('gallery');
  let allItems = galleryCol.find(filter);
  const desc = sort.startsWith('-');
  const field = desc ? sort.substring(1) : sort;
  allItems.sort((a, b) => {
    const aVal = a[field] || '';
    const bVal = b[field] || '';
    if (desc) return aVal < bVal ? 1 : -1;
    return aVal > bVal ? 1 : -1;
  });

  const total = allItems.length;
  // If limit is 0 or not provided, return all items (no pagination)
  const gallery = limit > 0 ? allItems.slice((page - 1) * limit, page * limit) : allItems;

  // Storage capacity check: max 300 images allowed
  const MAX_STORAGE = 300;
  const storageFull = total >= MAX_STORAGE;

  res.status(200).json({
    success: true,
    message: 'Gallery items retrieved successfully',
    data: { 
      gallery, 
      storageFull,
      storageUsed: total,
      storageMax: MAX_STORAGE,
      pagination: { total, page, limit: limit || total, totalPages: limit > 0 ? Math.ceil(total / limit) : 1 } 
    },
  });
};

exports.getGalleryItem = async (req, res) => {
  const galleryCol = getCollection('gallery');
  const item = galleryCol.findById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Gallery item not found' });
  }
  res.status(200).json({ success: true, message: 'Gallery item retrieved successfully', data: { gallery: item } });
};

exports.updateGalleryItem = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const updatedData = { ...req.body };
  if (req.file) updatedData.imageUrl = normalizeImageUrl(req, req.file);

  const galleryCol = getCollection('gallery');
  const item = galleryCol.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
  if (!item) {
    return res.status(404).json({ success: false, message: 'Gallery item not found' });
  }
  res.status(200).json({ success: true, message: 'Gallery item updated successfully', data: { gallery: item } });
};

exports.deleteGalleryItem = async (req, res) => {
  const galleryCol = getCollection('gallery');
  const item = galleryCol.findByIdAndDelete(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Gallery item not found' });
  }
  res.status(200).json({ success: true, message: 'Gallery item removed successfully', data: {} });
};

exports.bulkDeleteGalleryItems = async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide an array of image IDs to delete' });
  }

  const galleryCol = getCollection('gallery');
  
  try {
    const result = await galleryCol.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ 
      success: true, 
      message: `Successfully deleted ${result.deletedCount} image(s)`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting images', error: error.message });
  }
};
