const rateLimit = require('express-rate-limit');
const GPTLog = require('../models/GPTLog');

// Simple in-memory rate limiter (per-minute)
const gptRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per minute
  message: {
    message: 'Too many requests from this IP, please try again after a minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Check total usage limit (250 calls per user)
const checkTotalUsageLimit = async (req, res, next) => {
  try {
    // Get user ID or IP address
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!userId && !ipAddress) {
      return next();
    }

    // Count total GPT calls for this user
    let totalCalls = 0;

    if (userId) {
      totalCalls = await GPTLog.countDocuments({ userId });
    } else {
      // For anonymous users, count by IP
      totalCalls = await GPTLog.countDocuments({ ipAddress, userId: null });
    }

    // Check if user has exceeded the limit
    if (totalCalls >= 250) {
      return res.status(429).json({
        message: 'You have reached the maximum limit of 250 AI recommendations',
        totalCalls,
        limit: 250,
      });
    }

    // Add usage info to request for logging
    req.gptUsageInfo = {
      totalCalls,
      remainingCalls: 250 - totalCalls,
    };

    next();
  } catch (error) {
    console.error('Error checking usage limit:', error);
    // Continue even if check fails
    next();
  }
};

module.exports = {
  gptRateLimiter,
  checkTotalUsageLimit,
};