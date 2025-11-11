const mongoose = require('mongoose');

const gptLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  prompt: {
    type: String,
    required: true,
  },
  promptLength: {
    type: Number,
    required: true,
  },
  maxSuggestions: {
    type: Number,
    default: 5,
  },
  tokensUsed: {
    type: Number,
    default: 0,
  },
  success: {
    type: Boolean,
    default: true,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ipAddress: {
    type: String,
    default: null,
  },
});

// Index for faster queries
gptLogSchema.index({ userId: 1, timestamp: -1 });
gptLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('GPTLog', gptLogSchema);