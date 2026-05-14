const mongoose = require('mongoose');

const modmailSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  discordId: {
    type: String,
    required: true,
    index: true
  },
  robloxId: {
    type: String,
    default: null
  },
  channelId: {
    type: String,
    required: true
  },
  threadId: {
    type: String,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'staff'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    attachments: [{
      url: String,
      filename: String,
      size: Number
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  openedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    default: null
  },
  closedBy: {
    type: String,
    default: null
  },
  assignedTo: {
    type: String,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

modmailSchema.index({ discordId: 1, isOpen: 1 });
modmailSchema.index({ isOpen: 1, openedAt: -1 });

module.exports = mongoose.model('ModMail', modmailSchema);
