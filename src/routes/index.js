const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const courseRoutes = require('./courses');
const gptRoutes = require('./gpt');

// Mount auth routes
router.use('/auth', authRoutes);

// Mount course routes
router.use('/courses', courseRoutes);

// Mount GPT routes
router.use('/gpt', gptRoutes);

// Base API route
router.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

module.exports = router;