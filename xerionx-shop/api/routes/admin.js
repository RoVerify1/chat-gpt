const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Log = require('../models/Log');
const { isAdmin, adminLimiter } = require('../middleware/auth');

/**
 * GET /api/admin/stats
 * Get comprehensive system statistics
 */
router.get('/stats', adminLimiter, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const linkedUsers = await User.countDocuments({ robloxId: { $ne: null } });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });

    const totalPurchases = await Purchase.countDocuments();
    const deliveredPurchases = await Purchase.countDocuments({ deliveryStatus: 'delivered' });
    const pendingPurchases = await Purchase.countDocuments({ deliveryStatus: 'pending' });
    const failedPurchases = await Purchase.countDocuments({ deliveryStatus: 'failed' });

    // Revenue calculation (if price data is available)
    const revenueData = await Purchase.aggregate([
      { $match: { deliveryStatus: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // Recent activity
    const recentPurchases = await Purchase.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('productId', 'name')
      .select('discordId robloxId productId deliveryStatus createdAt');

    // Sales by day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const salesByDay = await Purchase.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          linked: linkedUsers,
          banned: bannedUsers,
          unlinked: totalUsers - linkedUsers
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: totalProducts - activeProducts
        },
        purchases: {
          total: totalPurchases,
          delivered: deliveredPurchases,
          pending: pendingPurchases,
          failed: failedPurchases,
          deliveryRate: totalPurchases > 0 
            ? ((deliveredPurchases / totalPurchases) * 100).toFixed(2) 
            : 0
        },
        revenue: {
          total: totalRevenue,
          currency: 'USD'
        },
        recentPurchases,
        salesByDay
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with filtering
 */
router.get('/users', adminLimiter, isAdmin, async (req, res) => {
  try {
    const { 
      search, 
      isBanned, 
      limit = 50, 
      skip = 0 
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { discordId: { $regex: search, $options: 'i' } },
        { robloxId: { $regex: search, $options: 'i' } },
        { discordUsername: { $regex: search, $options: 'i' } },
        { robloxUsername: { $regex: search, $options: 'i' } }
      ];
    }

    if (isBanned !== undefined) {
      query.isBanned = isBanned === 'true';
    }

    const users = await User.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: parseInt(skip) + parseInt(limit) < total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * POST /api/admin/users/:discordId/ban
 * Ban a user
 */
router.post('/users/:discordId/ban', adminLimiter, isAdmin, async (req, res) => {
  try {
    const { discordId } = req.params;
    const { reason } = req.body;

    const user = await User.findOneAndUpdate(
      { discordId },
      { 
        isBanned: true, 
        banReason: reason || 'No reason specified' 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await Log.create({
      action: 'user_banned',
      userId: req.user?.discordId,
      discordId,
      robloxId: user.robloxId,
      details: { reason }
    });

    res.json({
      success: true,
      message: `User ${discordId} has been banned`,
      data: user
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ban user'
    });
  }
});

/**
 * POST /api/admin/users/:discordId/unban
 * Unban a user
 */
router.post('/users/:discordId/unban', adminLimiter, isAdmin, async (req, res) => {
  try {
    const { discordId } = req.params;

    const user = await User.findOneAndUpdate(
      { discordId },
      { isBanned: false, banReason: null },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await Log.create({
      action: 'user_unbanned',
      userId: req.user?.discordId,
      discordId,
      robloxId: user.robloxId
    });

    res.json({
      success: true,
      message: `User ${discordId} has been unbanned`,
      data: user
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unban user'
    });
  }
});

/**
 * POST /api/admin/purchases/:purchaseId/resend
 * Resend delivery for a purchase
 */
router.post('/purchases/:purchaseId/resend', adminLimiter, isAdmin, async (req, res) => {
  try {
    const { purchaseId } = req.params;

    const purchase = await Purchase.findOne({ purchaseId }).populate('productId');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }

    // Reset delivery status to trigger re-delivery
    purchase.deliveryStatus = 'retry';
    purchase.deliveryAttempts = (purchase.deliveryAttempts || 0) + 1;
    await purchase.save();

    await Log.create({
      action: 'delivery_resend',
      userId: req.user?.discordId,
      discordId: purchase.discordId,
      purchaseId,
      details: { attempt: purchase.deliveryAttempts }
    });

    // Emit event for bot to handle re-delivery
    const EventEmitter = require('events');
    const deliveryEmitter = new EventEmitter();
    deliveryEmitter.emit('purchase:resend', { purchase });

    res.json({
      success: true,
      message: 'Delivery queued for resend',
      data: {
        purchaseId,
        status: 'queued',
        attempts: purchase.deliveryAttempts
      }
    });
  } catch (error) {
    console.error('Error resending delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend delivery'
    });
  }
});

/**
 * GET /api/admin/logs
 * Get system logs
 */
router.get('/logs', adminLimiter, isAdmin, async (req, res) => {
  try {
    const { 
      action, 
      userId, 
      limit = 100, 
      skip = 0 
    } = req.query;

    const query = {};
    
    if (action) {
      query.action = action;
    }
    
    if (userId) {
      query.$or = [
        { userId },
        { discordId: userId },
        { robloxId: userId }
      ];
    }

    const logs = await Log.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await Log.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs'
    });
  }
});

module.exports = router;
