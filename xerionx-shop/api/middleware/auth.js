const User = require('../models/User');

/**
 * Middleware to verify API secret key from Roblox requests
 */
const verifyApiSecret = (req, res, next) => {
  const apiSecret = req.headers['x-api-secret'];
  const expectedSecret = process.env.ROBLOX_API_SECRET;

  if (!apiSecret) {
    return res.status(401).json({
      success: false,
      error: 'Missing API secret'
    });
  }

  if (apiSecret !== expectedSecret) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API secret'
    });
  }

  next();
};

/**
 * Middleware to verify user is linked
 */
const verifyLinkedUser = async (req, res, next) => {
  const { discordId, robloxId } = req.body;

  if (!discordId || !robloxId) {
    return res.status(400).json({
      success: false,
      error: 'Missing discordId or robloxId'
    });
  }

  try {
    const user = await User.findOne({ discordId, robloxId });

    if (!user) {
      return res.status(403).json({
        success: false,
        error: 'Accounts not linked. Please link your Discord and Roblox accounts first.'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        error: `Your account has been banned. Reason: ${user.banReason || 'Not specified'}`
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error verifying linked user:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Middleware to check if user is admin
 */
const isAdmin = (req, res, next) => {
  const adminIds = process.env.ADMIN_IDS?.split(',') || [];
  const userId = req.user?.discordId || req.headers['x-user-id'];

  if (!userId || !adminIds.includes(userId)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

/**
 * Middleware to validate request signature
 */
const validateSignature = (req, res, next) => {
  const SignatureService = require('../services/signature');
  
  const signature = req.headers['x-request-signature'];
  const timestamp = req.headers['x-request-timestamp'];

  if (!signature || !timestamp) {
    return res.status(401).json({
      success: false,
      error: 'Missing signature or timestamp'
    });
  }

  // Check if timestamp is within acceptable window (5 minutes)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return res.status(401).json({
      success: false,
      error: 'Request timestamp expired'
    });
  }

  const dataToVerify = {
    ...req.body,
    timestamp: requestTime
  };

  const isValid = SignatureService.verifySignature(
    dataToVerify,
    signature,
    process.env.ROBLOX_API_SECRET
  );

  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: 'Invalid request signature'
    });
  }

  next();
};

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs to prevent XSS and injection
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = typeof value === 'string' ? sanitizeString(value) : sanitizeObject(value);
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
};

module.exports = {
  verifyApiSecret,
  verifyLinkedUser,
  isAdmin,
  validateSignature,
  sanitizeInput
};
