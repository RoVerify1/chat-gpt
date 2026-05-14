const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    default: null
  },
  discordId: {
    type: String,
    default: null
  },
  robloxId: {
    type: String,
    default: null
  },
  productId: {
    type: String,
    default: null
  },
  details: {
    type: Object,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for faster time-based queries
logSchema.index({ createdAt: -1 });
logSchema.index({ action: 1, createdAt: -1 });
logSchema.index({ userId: 1, createdAt: -1 });

// Auto-expire logs after 90 days (optional)
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Log', logSchema);
