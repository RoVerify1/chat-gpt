const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SignatureService = require('../services/signature');
const { verifyApiSecret, sanitizeInput, linkLimiter } = require('../middleware/auth');
const Log = require('../models/Log');

/**
 * POST /api/link/request
 * Request a verification code for linking accounts
 */
router.post('/request', linkLimiter, sanitizeInput, async (req, res) => {
  try {
    const { discordId, discordUsername } = req.body;

    if (!discordId) {
      return res.status(400).json({
        success: false,
        error: 'Discord ID is required'
      });
    }

    // Check if already linked
    const existingUser = await User.findOne({ discordId });
    if (existingUser && existingUser.robloxId) {
      return res.status(400).json({
        success: false,
        error: 'This Discord account is already linked to a Roblox account.'
      });
    }

    // Generate verification code
    const verificationCode = SignatureService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update or create user with verification code
    await User.findOneAndUpdate(
      { discordId },
      {
        discordId,
        discordUsername: discordUsername || '',
        verificationCode,
        verificationExpires: expiresAt
      },
      { upsert: true, new: true }
    );

    // Log the action
    await Log.create({
      action: 'link_request',
      discordId,
      details: { verificationCodeSent: true }
    });

    res.json({
      success: true,
      message: 'Verification code generated',
      data: {
        verificationCode,
        expiresAt,
        instructions: `Enter this code in your Roblox game to link your account. Code expires in 15 minutes.`
      }
    });
  } catch (error) {
    console.error('Error requesting link:', error);
    
    await Log.create({
      action: 'link_request_error',
      discordId: req.body.discordId,
      success: false,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to generate verification code'
    });
  }
});

/**
 * POST /api/link/verify
 * Verify the linking code from Roblox side
 */
router.post('/verify', linkLimiter, verifyApiSecret, sanitizeInput, async (req, res) => {
  try {
    const { discordId, robloxId, robloxUsername, verificationCode } = req.body;

    if (!discordId || !robloxId || !verificationCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: discordId, robloxId, verificationCode'
      });
    }

    // Find user with matching discordId and verification code
    const user = await User.findOne({
      discordId,
      verificationCode
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Invalid verification code or Discord ID'
      });
    }

    // Check if code has expired
    if (user.verificationExpires && user.verificationExpires < new Date()) {
      // Clear expired code
      await User.updateOne(
        { discordId },
        { $unset: { verificationCode: 1, verificationExpires: 1 } }
      );

      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new one.'
      });
    }

    // Check if robloxId is already linked to another account
    const existingRobloxLink = await User.findOne({ robloxId });
    if (existingRobloxLink && existingRobloxLink.discordId !== discordId) {
      return res.status(400).json({
        success: false,
        error: 'This Roblox account is already linked to another Discord account.'
      });
    }

    // Complete the link
    user.robloxId = robloxId;
    user.robloxUsername = robloxUsername || '';
    user.verificationCode = null;
    user.verificationExpires = null;
    user.linkedAt = new Date();
    await user.save();

    // Log the successful link
    await Log.create({
      action: 'account_linked',
      discordId,
      robloxId,
      details: { robloxUsername }
    });

    res.json({
      success: true,
      message: 'Accounts successfully linked!',
      data: {
        discordId,
        robloxId,
        linkedAt: user.linkedAt
      }
    });
  } catch (error) {
    console.error('Error verifying link:', error);
    
    await Log.create({
      action: 'link_verify_error',
      discordId: req.body.discordId,
      success: false,
      errorMessage: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to verify account link'
    });
  }
});

/**
 * GET /api/link/status/:discordId
 * Check linking status for a user
 */
router.get('/status/:discordId', async (req, res) => {
  try {
    const { discordId } = req.params;

    const user = await User.findOne({ discordId });

    if (!user) {
      return res.json({
        success: true,
        data: {
          isLinked: false,
          message: 'No account found. Please link your accounts first.'
        }
      });
    }

    res.json({
      success: true,
      data: {
        isLinked: !!user.robloxId,
        discordId: user.discordId,
        robloxId: user.robloxId || null,
        robloxUsername: user.robloxUsername || null,
        linkedAt: user.linkedAt,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    console.error('Error checking link status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check link status'
    });
  }
});

module.exports = router;
