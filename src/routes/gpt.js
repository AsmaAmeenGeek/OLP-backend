const express = require('express');
const router = express.Router();
const gptController = require('../controllers/gptController');
const auth = require('../middleware/auth');
const { gptRateLimiter, checkTotalUsageLimit } = require('../middleware/rateLimiter');

// POST /api/gpt/recommend, with rate limiting
router.post(
  '/recommend',
  gptRateLimiter,
  checkTotalUsageLimit,
  gptController.recommendCourses
);

// GET /api/gpt/stats, get user's usage statistics
router.get('/stats', auth, gptController.getUsageStats);

module.exports = router;