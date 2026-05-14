/**
 * XerionX Roblox Integration API
 * Express server for handling Roblox purchases
 */

const express = require('express');
const config = require('./config');
const utils = require('./utils');
const shop = require('./shop');

const app = express();
const PORT = config.ROBLOX.PORT;

// Middleware
app.use(express.json());

// Rate limiting (simple implementation)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window

function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, { count: 1, startTime: now });
        return next();
    }
    
    const record = rateLimitStore.get(ip);
    
    if (now - record.startTime > RATE_LIMIT_WINDOW) {
        record.count = 1;
        record.startTime = now;
        return next();
    }
    
    if (record.count >= RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    
    record.count++;
    next();
}

app.use(rateLimit);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now(), service: 'XerionX API' });
});

/**
 * Purchase endpoint
 * POST /purchase
 * 
 * Expected body:
 * {
 *   "apiKey": "your-api-key",
 *   "userId": "discord-user-id",
 *   "productId": "product-id",
 *   "robloxData": { ... } // optional Roblox transaction data
 * }
 */
app.post('/purchase', async (req, res) => {
    try {
        const { apiKey, userId, productId, robloxData } = req.body;
        
        // Validate required fields
        if (!apiKey || !userId || !productId) {
            utils.log(`Invalid purchase request - missing fields from ${req.ip}`, 'SECURITY');
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: apiKey, userId, productId' 
            });
        }
        
        // Validate API key
        if (!utils.validateApiKey(apiKey)) {
            utils.log(`Invalid API key attempt from ${req.ip}`, 'SECURITY');
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid API key' 
            });
        }
        
        // Validate user ID format
        if (!/^\d{17,19}$/.test(userId)) {
            utils.log(`Invalid Discord user ID format: ${userId}`, 'SECURITY');
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid Discord user ID format' 
            });
        }
        
        // Check if product exists
        const product = shop.getProductById(productId);
        if (!product) {
            utils.log(`Purchase attempt for non-existent product: ${productId}`, 'SHOP');
            return res.status(404).json({ 
                success: false, 
                error: 'Product not found' 
            });
        }
        
        // Log purchase attempt
        utils.log(`Purchase request: ${productId} by ${userId} from ${req.ip}`, 'SHOP');
        
        // Store purchase for processing
        // The actual delivery will be handled by the bot
        const purchaseData = {
            userId,
            productId,
            productName: product.name,
            price: product.price,
            robloxData,
            timestamp: Date.now(),
            ip: req.ip
        };
        
        // Emit event for bot to process
        if (global.purchaseQueue) {
            global.purchaseQueue.push(purchaseData);
        }
        
        utils.log(`Purchase queued for delivery: ${productId} -> ${userId}`, 'SHOP');
        
        res.json({
            success: true,
            message: 'Purchase received and queued for delivery',
            purchaseId: `PUR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
        });
        
    } catch (error) {
        utils.log(`Purchase endpoint error: ${error.message}`, 'ERROR');
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

/**
 * Products endpoint (public - shows available products)
 * GET /products
 */
app.get('/products', (req, res) => {
    const products = shop.getAllProducts().map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description
    }));
    
    res.json({ success: true, products });
});

/**
 * Start API server
 */
function startServer(client) {
    // Make client available to routes
    app.locals.client = client;
    
    app.listen(PORT, () => {
        utils.log(`Roblox API server running on port ${PORT}`, 'API');
    });
    
    return app;
}

module.exports = {
    app,
    startServer
};
