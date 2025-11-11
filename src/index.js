const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes');

// Load environment variables from .env file
dotenv.config();

const app = express();

// CORS with origins for local + Netlify
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://olp-frontend-oyx8.onrender.com'  // <- Add this
  ],
  credentials: true
}));

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use('/api', routes);

// Health check route for deployment platforms
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// MongoDB Connection 
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);  // Removed deprecated options
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process if db connection fails
  }
};

// Start the server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

module.exports = app;
