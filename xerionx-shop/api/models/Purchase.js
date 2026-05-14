const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
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
    required: true,
    index: true
  },
  productId: {
    type: String,
    required: true,
    ref: 'Product'
  },
  robloxProductId: {
    type: String,
    required: true,
    index: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  purchaseId: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'delivered', 'failed', 'retry'],
    default: 'pending'
  },
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  deliveryData: {
    filePath: String,
    downloadLink: String,
    licenseKey: String,
    messageId: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationSignature: {
    type: String,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster lookups
purchaseSchema.index({ transactionId: 1 });
purchaseSchema.index({ purchaseId: 1 });
purchaseSchema.index({ discordId: 1, createdAt: -1 });
purchaseSchema.index({ robloxId: 1, createdAt: -1 });
purchaseSchema.index({ deliveryStatus: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
