const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const User = require('../models/User');
const Log = require('../models/Log');
const SignatureService = require('../services/signature');
const { verifyApiSecret, validateSignature, purchaseLimiter, sanitizeInput } = require('../middleware/auth');

/**
 * POST /api/purchase/webhook
 * Webhook endpoint for Roblox purchase notifications
 */
router.post('/webhook', purchaseLimiter, verifyApiSecret, validateSignature, sanitizeInput, async (req, res) => {
  try {
    const {
      userId: robloxUserId,
      username: robloxUsername,
      productId: robloxProductId,
      purchaseId,
      transactionId,
      price,
      currency = 'USD',
      timestamp
    } = req.body;

    // Validate required fields
    if (!robloxUserId || !robloxProductId || !purchaseId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required purchase data'
      });
    }

    // Check for duplicate purchase
    const existingPurchase = await Purchase.findOne({
      $or: [
        { purchaseId },
        { transactionId: transactionId || purchaseId }
      ]
    });

    if (existingPurchase) {
      // If already delivered, return success without processing again
      if (existingPurchase.deliveryStatus === 'delivered') {
        return res.json({
          success: true,
          message: 'Purchase already processed',
          data: {
            purchaseId,
            status: 'already_delivered'
          }
        });
      }
    }

    // Find the product
    const product = await Product.findOne({
      robloxProductId,
      isActive: true
    });

    if (!product) {
      await Log.create({
        action: 'purchase_product_not_found',
        robloxId: robloxUserId,
        details: { robloxProductId, purchaseId },
        success: false
      });

      return res.status(404).json({
        success: false,
        error: 'Product not found or inactive'
      });
    }

    // Find linked user
    const user = await User.findOne({ robloxId: robloxUserId.toString() });

    if (!user) {
      await Log.create({
        action: 'purchase_unlinked_user',
        robloxId: robloxUserId,
        details: { robloxProductId, purchaseId },
        success: false
      });

      return res.status(403).json({
        success: false,
        error: 'User has not linked their Discord account. Please link accounts to receive purchases.'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        error: 'Account is banned'
      });
    }

    // Create purchase record
    const purchaseData = {
      userId: user._id.toString(),
      discordId: user.discordId,
      robloxId: robloxUserId.toString(),
      productId: product._id.toString(),
      robloxProductId,
      transactionId: transactionId || `TXN-${Date.now()}-${purchaseId}`,
      purchaseId,
      price: price || product.price,
      currency,
      verified: true,
      verificationSignature: req.headers['x-request-signature'],
      ipAddress: req.ip || req.headers['x-forwarded-for']
    };

    let purchase;
    
    if (existingPurchase) {
      // Update existing purchase
      Object.assign(existingPurchase, purchaseData);
      purchase = await existingPurchase.save();
    } else {
      // Create new purchase
      purchase = await Purchase.create(purchaseData);
    }

    // Log the purchase
    await Log.create({
      action: 'purchase_received',
      userId: user._id.toString(),
      discordId: user.discordId,
      robloxId: robloxUserId.toString(),
      productId: product._id.toString(),
      details: { purchaseId, robloxProductId, price }
    });

    // Emit event for bot to handle delivery
    // The bot will listen for this and send the DM
    const EventEmitter = require('events');
    const deliveryEmitter = new EventEmitter();
    deliveryEmitter.emit('purchase:verified', {
      purchase,
      user,
      product
    });

    res.json({
      success: true,
      message: 'Purchase verified and queued for delivery',
      data: {
        purchaseId,
        discordId: user.discordId,
        productName: product.name,
        deliveryStatus: 'pending'
      }
    });
  } catch (error) {
    console.error('Error processing purchase webhook:', error);
    
    await Log.create({
      action: 'purchase_webhook_error',
      robloxId: req.body.userId,
      success: false,
      errorMessage: error.message,
      details: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process purchase'
    });
  }
});

/**
 * GET /api/purchase/history/:discordId
 * Get purchase history for a user
 */
router.get('/history/:discordId', async (req, res) => {
  try {
    const { discordId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    const purchases = await Purchase.find({ discordId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('productId', 'name description');

    const total = await Purchase.countDocuments({ discordId });

    res.json({
      success: true,
      data: {
        purchases,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch purchase history'
    });
  }
});

/**
 * GET /api/purchase/:purchaseId
 * Get details of a specific purchase
 */
router.get('/:purchaseId', async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const purchase = await Purchase.findOne({ purchaseId })
      .populate('productId', 'name description');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }

    res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch purchase details'
    });
  }
});

module.exports = router;
