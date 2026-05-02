const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Projektname ist erforderlich'],
    trim: true,
    maxlength: [100, 'Projektname darf maximal 100 Zeichen lang sein']
  },
  board: {
    type: String,
    required: [true, 'Board ist erforderlich'],
    enum: ['ESP32-S3', 'ESP32', 'Arduino Uno', 'Arduino Nano', 'Raspberry Pi Pico', 'STM32', 'Other']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Beschreibung darf maximal 500 Zeichen lang sein']
  },
  code: {
    type: String,
    default: ''
  },
  components: [{
    name: String,
    quantity: Number,
    notes: String
  }],
  chatHistory: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
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

// Updatedat vor dem Speichern aktualisieren
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
