const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware zum Schutz von Routen
exports.protect = async (req, res, next) => {
  let token;

  // Token aus Header holen
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Kein Zugriff möglich. Bitte einloggen.'
    });
  }

  try {
    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // User laden
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User nicht gefunden.'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token ungültig oder abgelaufen.'
    });
  }
};

// Admin-Only Middleware
exports.admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Keine Berechtigung für diese Aktion.'
    });
  }
  next();
};
