const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  discordUsername: {
    type: String,
    default: ''
  },
  robloxId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  robloxUsername: {
    type: String,
    default: ''
  },
  linkedAt: {
    type: Date,
    default: Date.now
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: null
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster lookups
userSchema.index({ discordId: 1, robloxId: 1 });

module.exports = mongoose.model('User', userSchema);
