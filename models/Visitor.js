const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    ipHash: {
      type: String,
      default: null,
      index: true,
    },
    country: {
      type: String,
      default: 'Unknown',
    },
    city: {
      type: String,
      default: 'Unknown',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    operatingSystem: {
      type: String,
      default: 'Unknown',
    },
    deviceType: {
      type: String,
      enum: ['Desktop', 'Mobile', 'Tablet', 'Unknown'],
      default: 'Unknown',
    },
    screenResolution: {
      type: String,
      default: null,
    },
    referrer: {
      type: String,
      enum: ['Google', 'Facebook', 'Instagram', 'Direct', 'Other'],
      default: 'Direct',
    },
    currentPage: {
      type: String,
      default: '/',
    },
    pages: [
      {
        page: String,
        visitedAt: {
          type: Date,
          default: Date.now,
        },
        timeSpent: Number, // in seconds
      },
    ],
    firstVisitDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastVisitDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    visitCount: {
      type: Number,
      default: 1,
    },
    sessionDuration: {
      type: Number,
      default: 0, // in seconds
    },
    isReturning: {
      type: Boolean,
      default: false,
    },
    isAdminDevice: {
      type: Boolean,
      default: false,
    },
    isIncognito: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'visitors',
  }
);

// Index for queries
visitorSchema.index({ lastVisitDate: -1 });
visitorSchema.index({ firstVisitDate: -1 });
visitorSchema.index({ country: 1 });
visitorSchema.index({ browser: 1 });
visitorSchema.index({ deviceType: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
