const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  board: {
    type: String,
    required: true,
    enum: ['ESP32-S3', 'ESP32', 'Arduino Uno', 'Arduino Nano', 'Raspberry Pi Pico', 'STM32', 'ATmega328P']
  },
  description: String,
  code: String,
  components: [String],
  chatHistory: [{
    role: String,
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
