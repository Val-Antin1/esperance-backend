const express = require('express');
const router = express.Router();
const {
  recordVisit,
  getAnalyticsDashboard,
  getVisitsPerDay,
  getMostVisitedPages,
  getVisitorsByCountry,
  getBrowserUsage,
  getDeviceUsage,
  getRecentVisitors,
  getTopReturningVisitors,
  markAdminDevice,
} = require('../controllers/analyticsController');

// Public routes
router.post('/record', recordVisit);

// Admin dashboard routes
router.get('/dashboard', getAnalyticsDashboard);
router.get('/visits-per-day', getVisitsPerDay);
router.get('/most-visited-pages', getMostVisitedPages);
router.get('/visitors-by-country', getVisitorsByCountry);
router.get('/browser-usage', getBrowserUsage);
router.get('/device-usage', getDeviceUsage);
router.get('/recent-visitors', getRecentVisitors);
router.get('/top-returning-visitors', getTopReturningVisitors);

// Admin device management
router.post('/mark-admin-device', markAdminDevice);

module.exports = router;
