const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Log = require('../models/Log');
const { isAdmin, adminLimiter, sanitizeInput } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

/**
 * GET /api/products
 * Get all active products
 */
router.get('/', async (req, res) => {
  try {
    const { category, limit = 50 } = req.query;
    
    const query = { isActive: true };
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        products,
        count: products.length
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

/**
 * POST /api/products
 * Create a new product (Admin only)
 */
router.post('/', adminLimiter, isAdmin, sanitizeInput, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      robloxProductId,
      productIdType,
      fileType,
      fileName,
      fileSize,
      deliveryMethod = 'attachment',
      licenseKeyPrefix,
      category = 'general'
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !robloxProductId || !productIdType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if product ID already exists
    const existingProduct = await Product.findOne({ robloxProductId });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'A product with this Roblox Product ID already exists'
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      robloxProductId,
      productIdType,
      fileType: fileType || 'other',
      filePath: req.body.filePath || '',
      fileName: fileName || name,
      fileSize: fileSize || 0,
      deliveryMethod,
      licenseKeyPrefix,
      category,
      uploadedBy: req.user?.discordId || 'admin'
    });

    await Log.create({
      action: 'product_created',
      userId: req.user?.discordId,
      productId: product._id.toString(),
      details: { name, robloxProductId }
    });

    res.json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
});

/**
 * PUT /api/products/:id
 * Update a product (Admin only)
 */
router.put('/:id', adminLimiter, isAdmin, sanitizeInput, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove protected fields from update
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.downloadCount;

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await Log.create({
      action: 'product_updated',
      userId: req.user?.discordId,
      productId: id,
      details: { name: product.name }
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
});

/**
 * DELETE /api/products/:id
 * Delete/deactivate a product (Admin only)
 */
router.delete('/:id', adminLimiter, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const hardDelete = req.query.hard === 'true';

    if (hardDelete) {
      const product = await Product.findByIdAndDelete(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      // Delete associated file if exists
      if (product.filePath) {
        try {
          await fs.unlink(product.filePath);
        } catch (err) {
          console.warn('Could not delete file:', err);
        }
      }

      await Log.create({
        action: 'product_deleted',
        userId: req.user?.discordId,
        productId: id,
        details: { name: product.name }
      });
    } else {
      // Soft delete - just deactivate
      const product = await Product.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      await Log.create({
        action: 'product_deactivated',
        userId: req.user?.discordId,
        productId: id,
        details: { name: product.name }
      });
    }

    res.json({
      success: true,
      message: hardDelete ? 'Product deleted permanently' : 'Product deactivated'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

/**
 * GET /api/products/:id
 * Get a specific product
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Don't show sensitive info unless admin
    const isAdminUser = req.headers['x-user-id'] && 
      process.env.ADMIN_IDS?.split(',').includes(req.headers['x-user-id']);

    const responseData = product.toObject();
    if (!isAdminUser) {
      // Hide file path for non-admins
      delete responseData.filePath;
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

/**
 * GET /api/products/stats
 * Get product statistics (Admin only)
 */
router.get('/stats', adminLimiter, isAdmin, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = await Product.countDocuments({ isActive: false });

    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]);

    const topProducts = await Product.find()
      .sort({ downloadCount: -1 })
      .limit(5)
      .select('name downloadCount category');

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        categoryStats,
        topProducts
      }
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product statistics'
    });
  }
});

module.exports = router;
