const path = require('path');
const { validationResult } = require('express-validator');
const { getCollection } = require('../config/db');
const slugify = require('../utils/slugify');

const normalizeImageUrl = (req, file) => {
  if (!file) return '';
  const filePath = file.path || file.url || '';
  if (filePath.startsWith('http')) return filePath;
  const filename = path.basename(filePath);
  const origin = `${req.protocol}://${req.get('host')}`;
  return `${origin}/uploads/${filename}`;
};

exports.createNews = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const imageUrl = normalizeImageUrl(req, req.file);
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'Image upload is required' });
  }

  const slug = slugify(req.body.title);
  const newsCol = getCollection('news');
  const existing = newsCol.findOne({ slug });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An article with the same title already exists' });
  }

  const news = await newsCol.create({ ...req.body, imageUrl, slug });
  res.status(201).json({ success: true, message: 'News article created successfully', data: { news } });
};

exports.getNews = async (req, res) => {
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

  const newsCol = getCollection('news');
  const allNews = newsCol.find(filter);
  const desc = sort.startsWith('-');
  const field = desc ? sort.substring(1) : sort;
  allNews.sort((a, b) => {
    const aVal = a[field] || '';
    const bVal = b[field] || '';
    if (desc) return aVal < bVal ? 1 : -1;
    return aVal > bVal ? 1 : -1;
  });

  const total = allNews.length;
  const news = allNews.slice((page - 1) * limit, page * limit);

  res.status(200).json({
    success: true,
    message: 'News articles retrieved successfully',
    data: { news, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } },
  });
};

exports.getNewsById = async (req, res) => {
  const newsCol = getCollection('news');
  const news = newsCol.findById(req.params.id);
  if (!news) {
    return res.status(404).json({ success: false, message: 'News article not found' });
  }
  res.status(200).json({ success: true, message: 'News article retrieved successfully', data: { news } });
};

exports.updateNews = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', data: { errors: errors.array() } });
  }

  const updatedData = { ...req.body };
  if (req.file) {
    updatedData.imageUrl = normalizeImageUrl(req, req.file);
  }
  if (req.body.title) updatedData.slug = slugify(req.body.title);

  const newsCol = getCollection('news');
  const news = newsCol.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
  if (!news) {
    return res.status(404).json({ success: false, message: 'News article not found' });
  }
  res.status(200).json({ success: true, message: 'News article updated successfully', data: { news } });
};

exports.deleteNews = async (req, res) => {
  const newsCol = getCollection('news');
  const news = newsCol.findByIdAndDelete(req.params.id);
  if (!news) {
    return res.status(404).json({ success: false, message: 'News article not found' });
  }
  res.status(200).json({ success: true, message: 'News article removed successfully', data: {} });
};

exports.publishNews = async (req, res) => {
  const newsCol = getCollection('news');
  const news = newsCol.findByIdAndUpdate(req.params.id, { published: true }, { new: true, runValidators: true });
  if (!news) {
    return res.status(404).json({ success: false, message: 'News article not found' });
  }
  res.status(200).json({ success: true, message: 'News article published successfully', data: { news } });
};