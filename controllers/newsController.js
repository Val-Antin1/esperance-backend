const { validationResult } = require('express-validator');
const News = require('../models/News');
const slugify = require('../utils/slugify');

const createNews = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const imageUrl = req.file ? req.file.url : null;
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'Image upload is required' });
  }

  const slug = slugify(req.body.title);
  
  try {
    // Check if slug already exists
    const existing = await News.findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An article with the same title already exists' });
    }

    const news = await News.create({ ...req.body, imageUrl, slug });
    res.status(201).json({ success: true, message: 'News article created successfully', data: { news } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating news article', error: error.message });
  }
};

const getNews = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const sort = req.query.sort || '-createdAt';
  const search = req.query.search;
  const category = req.query.category;
  const published = req.query.published;

  const filter = {};
  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { content: new RegExp(search, 'i') },
      { category: new RegExp(search, 'i') },
    ];
  }
  if (category) filter.category = category;
  if (published !== undefined) filter.published = published === 'true';

  try {
    const total = await News.countDocuments(filter);
    const news = await News.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'News articles retrieved successfully',
      data: { news, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving news articles', error: error.message });
  }
};

const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }
    res.status(200).json({ success: true, message: 'News article retrieved successfully', data: { news } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving news article', error: error.message });
  }
};

const updateNews = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const updatedData = { ...req.body };
  if (req.file) {
    updatedData.imageUrl = req.file.url;
  }
  if (req.body.title) {
    updatedData.slug = slugify(req.body.title);
  }

  try {
    const news = await News.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
    if (!news) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }
    res.status(200).json({ success: true, message: 'News article updated successfully', data: { news } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating news article', error: error.message });
  }
};

const deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }
    res.status(200).json({ success: true, message: 'News article removed successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting news article', error: error.message });
  }
};

const publishNews = async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(req.params.id, { published: true }, { new: true, runValidators: true });
    if (!news) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }
    res.status(200).json({ success: true, message: 'News article published successfully', data: { news } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error publishing news article', error: error.message });
  }
};

module.exports = {
  createNews,
  getNews,
  getNewsById,
  updateNews,
  deleteNews,
  publishNews,
};