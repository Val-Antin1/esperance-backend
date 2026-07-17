const Visitor = require('../models/Visitor');
const crypto = require('crypto');
const UAParser = require('ua-parser-js');

// Utility function to hash IP
const hashIP = (ip) => {
  return crypto.createHash('sha256').update(ip).digest('hex');
};

// Extract referrer from referer header or request
const extractReferrer = (referer, userAgent) => {
  if (!referer) return 'Direct';
  
  const refererLower = referer.toLowerCase();
  if (refererLower.includes('google')) return 'Google';
  if (refererLower.includes('facebook')) return 'Facebook';
  if (refererLower.includes('instagram')) return 'Instagram';
  return 'Other';
};

// Parse user agent to get browser and OS
const parseUserAgent = (userAgent) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  return {
    browser: result.browser.name || 'Unknown',
    operatingSystem: result.os.name || 'Unknown',
    deviceType: result.device.type || 'Desktop',
  };
};

// Record a visitor hit
exports.recordVisit = async (req, res) => {
  try {
    const {
      visitorId,
      currentPage,
      screenResolution,
      referrer: clientReferrer,
      isIncognito,
      sessionDuration,
      isAdminDevice,
    } = req.body;

    if (!visitorId || !currentPage) {
      return res.status(400).json({
        success: false,
        message: 'visitorId and currentPage are required',
      });
    }

    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || '';
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || 'Unknown';
    
    const ipHash = hashIP(clientIP);
    const { browser, operatingSystem, deviceType } = parseUserAgent(userAgent);
    const parsedReferrer = extractReferrer(referer, userAgent);

    // Check if visitor exists
    let visitor = await Visitor.findOne({ visitorId });

    if (visitor) {
      // Returning visitor
      visitor.visitCount += 1;
      visitor.lastVisitDate = new Date();
      visitor.isReturning = true;
      visitor.currentPage = currentPage;
      visitor.screenResolution = screenResolution || visitor.screenResolution;
      visitor.sessionDuration = sessionDuration || visitor.sessionDuration;
      
      // Add page to history
      visitor.pages.push({
        page: currentPage,
        visitedAt: new Date(),
        timeSpent: sessionDuration || 0,
      });
    } else {
      // New visitor
      visitor = new Visitor({
        visitorId,
        ipAddress: clientIP,
        ipHash,
        browser,
        operatingSystem,
        deviceType,
        screenResolution,
        referrer: parsedReferrer,
        currentPage,
        sessionDuration: sessionDuration || 0,
        isIncognito,
        isAdminDevice,
        pages: [
          {
            page: currentPage,
            visitedAt: new Date(),
            timeSpent: sessionDuration || 0,
          },
        ],
      });
    }

    await visitor.save();

    res.json({
      success: true,
      message: 'Visit recorded successfully',
      visitor,
    });
  } catch (error) {
    console.error('Error recording visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording visit',
      error: error.message,
    });
  }
};

// Get analytics dashboard data
exports.getAnalyticsDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { isAdminDevice: false };
    
    if (startDate && endDate) {
      query.lastVisitDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const totalVisitors = await Visitor.countDocuments(query);
    const returningVisitors = await Visitor.countDocuments({ ...query, isReturning: true });
    const totalVisits = await Visitor.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$visitCount' } } },
    ]);

    // Visits today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const visitesToday = await Visitor.countDocuments({
      ...query,
      lastVisitDate: { $gte: today },
    });

    // Visits this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const visitsThisWeek = await Visitor.countDocuments({
      ...query,
      lastVisitDate: { $gte: weekAgo },
    });

    // Visits this month
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const visitsThisMonth = await Visitor.countDocuments({
      ...query,
      lastVisitDate: { $gte: monthAgo },
    });

    res.json({
      success: true,
      data: {
        totalVisitors,
        uniqueVisitors: totalVisitors,
        returningVisitors,
        totalVisits: totalVisits[0]?.total || 0,
        visitesToday,
        visitsThisWeek,
        visitsThisMonth,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics dashboard',
      error: error.message,
    });
  }
};

// Get visits per day
exports.getVisitsPerDay = async (req, res) => {
  try {
    const { startDate, endDate, days = 30 } = req.query;
    
    const query = { isAdminDevice: false };
    
    if (startDate && endDate) {
      query.lastVisitDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      query.lastVisitDate = { $gte: daysAgo };
    }

    const visitsPerDay = await Visitor.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$lastVisitDate' },
          },
          count: { $sum: 1 },
          visitCount: { $sum: '$visitCount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: visitsPerDay,
    });
  } catch (error) {
    console.error('Error fetching visits per day:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visits per day',
      error: error.message,
    });
  }
};

// Get most visited pages
exports.getMostVisitedPages = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const mostVisitedPages = await Visitor.aggregate([
      { $match: { isAdminDevice: false } },
      { $unwind: '$pages' },
      {
        $group: {
          _id: '$pages.page',
          visits: { $sum: 1 },
        },
      },
      { $sort: { visits: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.json({
      success: true,
      data: mostVisitedPages,
    });
  } catch (error) {
    console.error('Error fetching most visited pages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching most visited pages',
      error: error.message,
    });
  }
};

// Get visitor stats by country
exports.getVisitorsByCountry = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const visitorsByCountry = await Visitor.aggregate([
      { $match: { isAdminDevice: false } },
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 },
          visits: { $sum: '$visitCount' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.json({
      success: true,
      data: visitorsByCountry,
    });
  } catch (error) {
    console.error('Error fetching visitors by country:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visitors by country',
      error: error.message,
    });
  }
};

// Get browser usage
exports.getBrowserUsage = async (req, res) => {
  try {
    const browserUsage = await Visitor.aggregate([
      { $match: { isAdminDevice: false } },
      {
        $group: {
          _id: '$browser',
          count: { $sum: 1 },
          visits: { $sum: '$visitCount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: browserUsage,
    });
  } catch (error) {
    console.error('Error fetching browser usage:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching browser usage',
      error: error.message,
    });
  }
};

// Get device usage
exports.getDeviceUsage = async (req, res) => {
  try {
    const deviceUsage = await Visitor.aggregate([
      { $match: { isAdminDevice: false } },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
          visits: { $sum: '$visitCount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: deviceUsage,
    });
  } catch (error) {
    console.error('Error fetching device usage:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching device usage',
      error: error.message,
    });
  }
};

// Get recent visitors
exports.getRecentVisitors = async (req, res) => {
  try {
    const { limit = 20, page = 1, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { isAdminDevice: false };

    if (search) {
      query.$or = [
        { visitorId: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { browser: { $regex: search, $options: 'i' } },
      ];
    }

    const recentVisitors = await Visitor.find(query)
      .sort({ lastVisitDate: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Visitor.countDocuments(query);

    res.json({
      success: true,
      data: recentVisitors,
      pagination: {
        total,
        limit: parseInt(limit),
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching recent visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent visitors',
      error: error.message,
    });
  }
};

// Get top returning visitors
exports.getTopReturningVisitors = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const topReturning = await Visitor.find({ isAdminDevice: false, isReturning: true })
      .sort({ visitCount: -1, lastVisitDate: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: topReturning,
    });
  } catch (error) {
    console.error('Error fetching top returning visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top returning visitors',
      error: error.message,
    });
  }
};

// Mark device as admin
exports.markAdminDevice = async (req, res) => {
  try {
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: 'visitorId is required',
      });
    }

    const visitor = await Visitor.findOneAndUpdate(
      { visitorId },
      { isAdminDevice: true },
      { new: true }
    );

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found',
      });
    }

    res.json({
      success: true,
      message: 'Device marked as admin',
      visitor,
    });
  } catch (error) {
    console.error('Error marking admin device:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking admin device',
      error: error.message,
    });
  }
};
