const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  robloxProductId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  productIdType: {
    type: String,
    enum: ['devproduct', 'gamepass'],
    required: true
  },
  fileType: {
    type: String,
    enum: ['zip', 'script', 'image', 'document', 'other'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: String,
    required: true
  },
  deliveryMethod: {
    type: String,
    enum: ['attachment', 'link', 'key'],
    default: 'attachment'
  },
  licenseKeyPrefix: {
    type: String,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: 'general'
  }
}, {
  timestamps: true
});

// Index for faster lookups
productSchema.index({ robloxProductId: 1, isActive: 1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
