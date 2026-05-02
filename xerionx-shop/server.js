require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (use database in production)
const otpStore = new Map();
const users = new Map();

// Email transporter setup
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Request OTP
app.post('/api/auth/request-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email required' });
        }

        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        otpStore.set(email, { otp, expiresAt });

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'XerionX Login Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #ff6a00;">XerionX Login</h2>
                    <p>Your verification code is:</p>
                    <h1 style="color: #ff6a00; font-size: 32px;">${otp}</h1>
                    <p>This code will expire in 5 minutes.</p>
                </div>
            `
        };

        // Try to send email, fallback to console in development
        let debugCode = null;
        try {
            await transporter.sendMail(mailOptions);
            console.log(`OTP sent to ${email}`);
        } catch (emailError) {
            console.log('Email sending failed, using debug mode');
            debugCode = otp;
        }

        res.json({ 
            success: true, 
            message: 'OTP sent successfully',
            debugCode: process.env.NODE_ENV === 'development' ? debugCode : undefined
        });

    } catch (error) {
        console.error('OTP request error:', error);
        res.status(500).json({ success: false, error: 'Failed to send OTP' });
    }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ success: false, error: 'Email and code required' });
        }

        const storedData = otpStore.get(email);

        if (!storedData) {
            return res.status(400).json({ success: false, error: 'No OTP requested for this email' });
        }

        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ success: false, error: 'OTP expired' });
        }

        if (storedData.otp !== code) {
            return res.status(400).json({ success: false, error: 'Invalid OTP' });
        }

        otpStore.delete(email);

        // Create or get user
        let user = users.get(email);
        if (!user) {
            user = { email, id: Date.now().toString(), robloxId: null };
            users.set(email, user);
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ 
            success: true, 
            token,
            user: { email: user.email, robloxId: user.robloxId }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Access denied' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = users.get(req.user.email);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user: { email: user.email, robloxId: user.robloxId } });
});

// Link Roblox account
app.post('/api/user/link-roblox', authenticateToken, async (req, res) => {
    try {
        const { robloxUsername } = req.body;
        
        if (!robloxUsername) {
            return res.status(400).json({ success: false, error: 'Roblox username required' });
        }

        // Here you would integrate with Roblox API to verify the username
        // For now, we'll just store it
        const user = users.get(req.user.email);
        if (user) {
            user.robloxId = robloxUsername;
            users.set(req.user.email, user);
        }

        res.json({ success: true, message: 'Roblox account linked', robloxId: robloxUsername });

    } catch (error) {
        console.error('Link Roblox error:', error);
        res.status(500).json({ success: false, error: 'Failed to link Roblox account' });
    }
});

// Get products (example endpoint)
app.get('/api/products', (req, res) => {
    const products = [
        {
            id: '1',
            name: 'Premium Asset Pack',
            description: 'High-quality 3D assets for your games',
            price: 9.99,
            image: '/assets/product1.png',
            category: 'assets'
        },
        {
            id: '2',
            name: 'Script Bundle',
            description: 'Ready-to-use Lua scripts',
            price: 14.99,
            image: '/assets/product2.png',
            category: 'scripts'
        },
        {
            id: '3',
            name: 'UI Kit',
            description: 'Modern UI components for Roblox',
            price: 7.99,
            image: '/assets/product3.png',
            category: 'ui'
        }
    ];
    res.json({ success: true, products });
});

// Purchase product (example endpoint)
app.post('/api/purchase', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;
        
        if (!productId) {
            return res.status(400).json({ success: false, error: 'Product ID required' });
        }

        const user = users.get(req.user.email);
        
        if (!user.robloxId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please link your Roblox account first' 
            });
        }

        // Here you would integrate with payment processor and Roblox API
        // to deliver the product
        
        res.json({ 
            success: true, 
            message: 'Purchase successful! Item will be delivered to your Roblox account.',
            transactionId: `TXN-${Date.now()}`
        });

    } catch (error) {
        console.error('Purchase error:', error);
        res.status(500).json({ success: false, error: 'Purchase failed' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 XerionX Shop server running on http://localhost:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});
