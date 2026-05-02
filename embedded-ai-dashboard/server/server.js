require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

const app = express();

// Security Middleware
app.use(helmet());

// CORS konfigurieren
const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL] : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Nicht erlaubte Domain'));
    }
  },
  credentials: true
}));

// Rate Limiting für API-Schutz
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 Minuten
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Max 100 Requests pro Fenster
  message: {
    success: false,
    message: 'Zu viele Anfragen. Bitte später erneut versuchen.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiter auf alle /api Routen anwenden
app.use('/api/', limiter);

// Strengeres Rate Limiting für KI-Endpunkte
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 10, // Max 10 KI-Anfragen pro Minute
  message: {
    success: false,
    message: 'Zu viele KI-Anfragen. Bitte warten Sie einen Moment.'
  }
});

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// KI-Route mit extra Rate Limiting
app.use('/api/projects/:id/generate', aiLimiter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route nicht gefunden'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Serverfehler:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Interner Serverfehler' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// MongoDB Verbindung
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB verbunden: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB Verbindungsfehler:', err.message);
    process.exit(1);
  }
};

// Server starten
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server läuft im ${process.env.NODE_ENV || 'development'} Modus auf Port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/health`);
  });
};

startServer();

module.exports = app;
