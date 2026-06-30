const Gallery = require('../models/Gallery');

const createGalleryItem = async (req, res) => {
  try {
    const { title, category, description } = req.body;
    
    console.log('📥 Received gallery upload:', { title, category, description, hasFile: !!req.file });
    
    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const imageUrl = req.file ? req.file.url : null;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image upload is required' });
    }

  // Check storage capacity before creating
  const currentCount = await Gallery.countDocuments();
  const MAX_STORAGE = 300;
  if (currentCount >= MAX_STORAGE) {
    return res.status(400).json({ 
      success: false, 
      message: `The storage is full! Maximum capacity of ${MAX_STORAGE} images reached. Please delete some images before uploading new ones.` 
    });
  }

    const item = await Gallery.create({ title, category, description, imageUrl });
    console.log('✅ Gallery item created:', item._id);
    res.status(201).json({ success: true, message: 'Gallery item created successfully', data: { gallery: item } });
  } catch (error) {
    console.error('❌ Error creating gallery item:', error);
    res.status(500).json({ success: false, message: 'Error creating gallery item', error: error.message });
  }
};

const getGalleryItems = async (req, res) => {
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

  try {
    const total = await Gallery.countDocuments(filter);
    
    // If limit is 0 or not provided, return all items (no pagination)
    const skip = limit > 0 ? (page - 1) * limit : 0;
    const gallery = await Gallery.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit > 0 ? limit : 0);

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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving gallery items', error: error.message });
  }
};

const getGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }
    res.status(200).json({ success: true, message: 'Gallery item retrieved successfully', data: { gallery: item } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving gallery item', error: error.message });
  }
};

const updateGalleryItem = async (req, res) => {
  try {
    const { title, category, description } = req.body;
    
    console.log('📥 Received gallery update:', { id: req.params.id, title, category, description, hasFile: !!req.file });
    
    // Validate required fields if provided
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title cannot be empty' });
    }
    
    if (category !== undefined && !category) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const updatedData = { ...req.body };
  if (req.file) {
    updatedData.imageUrl = req.file.url;
  }

    const item = await Gallery.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }
    console.log('✅ Gallery item updated:', item._id);
    res.status(200).json({ success: true, message: 'Gallery item updated successfully', data: { gallery: item } });
  } catch (error) {
    console.error('❌ Error updating gallery item:', error);
    res.status(500).json({ success: false, message: 'Error updating gallery item', error: error.message });
  }
};

const deleteGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }
    res.status(200).json({ success: true, message: 'Gallery item removed successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting gallery item', error: error.message });
  }
};

const bulkDeleteGalleryItems = async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide an array of image IDs to delete' });
  }

  try {
    const result = await Gallery.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ 
      success: true, 
      message: `Successfully deleted ${result.deletedCount} image(s)`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting images', error: error.message });
  }
};

module.exports = {
  createGalleryItem,
  getGalleryItems,
  getGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  bulkDeleteGalleryItems,
};