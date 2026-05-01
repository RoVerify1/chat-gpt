require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5000', 'https://your-vercel-domain.vercel.app'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xerionx')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Mongoose Schemas
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  downloadLink: { type: String, required: true },
  image: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const CodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  downloadLink: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  usedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', ProductSchema);
const Code = mongoose.model('Code', CodeSchema);

// Helper: Generate unique code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'XER-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// API Routes

// GET /api/products - Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/create-order - Create order and generate code
app.post('/api/create-order', async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Generate unique code
    let code;
    let exists = true;
    while (exists) {
      code = generateCode();
      const existing = await Code.findOne({ code });
      exists = !!existing;
    }

    const codeDoc = new Code({
      code,
      productName: product.name,
      downloadLink: product.downloadLink
    });

    await codeDoc.save();

    res.json({ 
      success: true, 
      code,
      message: 'Code generated successfully. Join the game and redeem this code.'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/redeem/:code - Redeem a code
app.get('/api/redeem/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const codeDoc = await Code.findOne({ code: code.toUpperCase() });
    
    if (!codeDoc) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid code' 
      });
    }

    if (codeDoc.isUsed) {
      return res.status(400).json({ 
        success: false, 
        error: 'Code already used' 
      });
    }

    // Mark as used
    codeDoc.isUsed = true;
    codeDoc.usedAt = new Date();
    await codeDoc.save();

    res.json({ 
      success: true, 
      downloadLink: codeDoc.downloadLink,
      productName: codeDoc.productName
    });
  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({ error: 'Failed to redeem code' });
  }
});

// POST /api/products - Add new product (Admin)
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, downloadLink, image } = req.body;
    
    if (!name || !price || !downloadLink) {
      return res.status(400).json({ error: 'Name, price, and download link required' });
    }

    const product = new Product({ name, price, downloadLink, image });
    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// GET /api/codes - Get all codes (Admin)
app.get('/api/codes', async (req, res) => {
  try {
    const codes = await Code.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch codes' });
  }
});

// DELETE /api/products/:id - Delete product (Admin)
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 XerionX server running on port ${PORT}`);
});
