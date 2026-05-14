# XerionX Shop System - Security Documentation

## 🔒 Security Overview

The XerionX Shop System implements multiple layers of security to protect against fraud, unauthorized access, and data breaches.

---

## 1. Authentication & Authorization

### API Secret Key System

All communication between Roblox and the backend API requires a secret key:

```javascript
// Request headers from Roblox
headers: {
    "X-API-Secret": "your_secret_key",
    "X-Request-Timestamp": "1704067200000",
    "X-Request-Signature": "hmac_sha256_signature"
}
```

**Implementation:**
- Secret key must match `ROBLOX_API_SECRET` in environment
- Never expose this key in client-side code
- Rotate keys periodically

### HMAC Signature Verification

Every request from Roblox includes a cryptographic signature:

```javascript
// Signature generation (Node.js)
const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(sortedData))
    .digest('hex');
```

**Security Benefits:**
- Prevents request tampering
- Verifies request origin
- Protects against man-in-the-middle attacks

### Timestamp Validation

Requests expire after 5 minutes:

```javascript
const requestTime = parseInt(timestamp);
if (Math.abs(Date.now() - requestTime) > 5 * 60 * 1000) {
    return res.status(401).json({ error: 'Request timestamp expired' });
}
```

**Prevents:**
- Replay attacks
- Delayed fraudulent requests

---

## 2. Rate Limiting

### Tiered Rate Limits

Different endpoints have different limits:

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 15 minutes |
| Purchase Webhook | 10 requests | 1 minute |
| Account Linking | 5 attempts | 15 minutes |
| Admin Operations | 30 requests | 1 minute |

**Implementation:**
```javascript
const purchaseLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many purchase requests' }
});
```

**Benefits:**
- Prevents DDoS attacks
- Stops brute force attempts
- Protects against spam

---

## 3. Input Validation & Sanitization

### Input Sanitization Middleware

All inputs are sanitized before processing:

```javascript
const sanitizeString = (str) => {
    return str
        .replace(/[<>]/g, '') // Remove HTML brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .trim();
};
```

**Protects Against:**
- XSS (Cross-Site Scripting)
- HTML injection
- Protocol injection

### Schema Validation

Mongoose schemas enforce data types:

```javascript
const productSchema = new mongoose.Schema({
    price: {
        type: Number,
        required: true,
        min: 0  // Prevents negative prices
    },
    productIdType: {
        type: String,
        enum: ['devproduct', 'gamepass']  // Only allowed values
    }
});
```

---

## 4. Access Control

### User Linking Requirement

Users must link Discord and Roblox accounts:

```javascript
if (!user || !user.robloxId) {
    return res.status(403).json({
        error: 'Accounts not linked. Please link first.'
    });
}
```

**Benefits:**
- Prevents anonymous purchases
- Enables proper delivery tracking
- Reduces fraud

### Admin-Only Commands

Admin commands verify Discord user ID:

```javascript
const isAdmin = (req, res, next) => {
    const adminIds = process.env.ADMIN_IDS?.split(',') || [];
    const userId = req.user?.discordId || req.headers['x-user-id'];

    if (!adminIds.includes(userId)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};
```

### Ban System

Banned users are blocked from all operations:

```javascript
if (user.isBanned) {
    return res.status(403).json({
        error: `Account banned. Reason: ${user.banReason}`
    });
}
```

---

## 5. Purchase Verification

### Duplicate Prevention

System checks for duplicate purchases:

```javascript
const existingPurchase = await Purchase.findOne({
    $or: [
        { purchaseId },
        { transactionId: transactionId || purchaseId }
    ]
});

if (existingPurchase && existingPurchase.deliveryStatus === 'delivered') {
    return res.json({ status: 'already_delivered' });
}
```

**Prevents:**
- Double-spending
- Duplicate deliveries
- Exploitation of retry logic

### Product Validation

Verifies product exists and is active:

```javascript
const product = await Product.findOne({
    robloxProductId,
    isActive: true
});

if (!product) {
    // Log suspicious activity
    await Log.create({
        action: 'purchase_product_not_found',
        details: { robloxProductId }
    });
    return res.status(404).json({ error: 'Product not found' });
}
```

---

## 6. File Security

### File Type Validation

Only allowed file extensions:

```javascript
const allowedExtensions = ['zip', 'lua', 'txt', 'md', 'pdf', 'png', 'jpg', 'jpeg'];
const fileExtension = attachment.name.split('.').pop().toLowerCase();

if (!allowedExtensions.includes(fileExtension)) {
    throw new Error('File type not allowed');
}
```

### File Size Limits

```javascript
// Environment variable
MAX_FILE_SIZE_MB=50

// In upload handler
if (fileSize > maxSize) {
    throw new Error('File too large');
}
```

### Secure File Storage

Files stored outside web root:
```
xerionx-shop/
├── uploads/          # Not publicly accessible
│   └── files...
├── api/
└── bot/
```

**Delivery Methods:**
1. **Attachment** - Bot sends file directly via DM
2. **Link** - Secure signed URL (if using cloud storage)
3. **Key** - Generated license key only

---

## 7. Data Protection

### Database Security

**MongoDB Best Practices:**
```javascript
const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

// Use authentication in production
MONGODB_URI=mongodb://user:password@localhost:27017/xerionx-shop
```

**Indexes for Performance:**
```javascript
userSchema.index({ discordId: 1, robloxId: 1 });
purchaseSchema.index({ transactionId: 1 });
```

### Sensitive Data Handling

**Never store:**
- Raw passwords (not needed - using OAuth/linking)
- Credit card info (handled by Roblox)
- Full IP addresses (can be hashed)

**Environment Variables:**
```env
# Never commit .env to git
DISCORD_TOKEN=secret
API_SECRET_KEY=secret
ROBLOX_API_SECRET=secret
MONGODB_URI=secret
```

Add to `.gitignore`:
```
.env
uploads/*
logs/*
*.log
```

---

## 8. Logging & Monitoring

### Comprehensive Logging

All actions are logged:

```javascript
await Log.create({
    action: 'purchase_received',
    userId: user._id.toString(),
    discordId: user.discordId,
    robloxId: user.robloxId,
    ipAddress: req.ip,
    details: { purchaseId, amount }
});
```

**Logged Events:**
- Account linking attempts
- Purchase transactions
- Admin actions
- Failed authentications
- Rate limit violations

### Log Retention

Logs auto-expire after 90 days:
```javascript
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
```

---

## 9. Network Security

### HTTPS Enforcement (Production)

Always use HTTPS in production:

```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /api/ {
        proxy_pass http://localhost:3001/;
    }
}
```

### CORS Configuration

Restrict API access:

```javascript
app.use(cors({
    origin: ['https://your-domain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Secret']
}));
```

### Helmet.js Security Headers

```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true
    }
}));
```

---

## 10. Anti-Fraud Measures

### Purchase Pattern Detection

Monitor for suspicious patterns:
- Multiple purchases in short time
- Unusual purchase amounts
- Geographic anomalies

### IP Tracking

Track IP addresses for abuse:
```javascript
ipAddress: req.ip || req.headers['x-forwarded-for']
```

### Transaction Integrity

Each transaction has unique identifiers:
```javascript
transactionId: `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
purchaseId: receiptInfo.PurchaseId  // From Roblox
```

---

## 11. Security Checklist

### Before Deployment

- [ ] Generate strong random secrets
- [ ] Enable HTTPS
- [ ] Configure firewall
- [ ] Set up MongoDB authentication
- [ ] Enable rate limiting
- [ ] Test webhook signatures
- [ ] Verify admin IDs
- [ ] Set up log monitoring
- [ ] Configure backups
- [ ] Review CORS settings

### Ongoing Maintenance

- [ ] Monitor logs daily
- [ ] Review failed purchases
- [ ] Check for unusual patterns
- [ ] Update dependencies regularly
- [ ] Rotate secrets quarterly
- [ ] Backup database weekly
- [ ] Review ban list
- [ ] Audit admin access

---

## 12. Incident Response

### If Compromised

1. **Rotate all secrets immediately**
   ```bash
   # Generate new secrets
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Review logs for unauthorized access**
   ```javascript
   // Query suspicious activity
   const suspiciousLogs = await Log.find({
       success: false,
       createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
   });
   ```

3. **Ban suspicious accounts**
   ```javascript
   await User.updateMany(
       { discordId: { $in: suspiciousIds } },
       { isBanned: true, banReason: 'Security review' }
   );
   ```

4. **Notify affected users**

5. **Review and patch vulnerability**

---

## 13. Compliance Considerations

### GDPR
- Users can request data deletion
- Logs contain minimal PII
- Data retention policies in place

### COPPA
- Age verification handled by Roblox/Discord
- No personal data collected from children under 13

### Terms of Service
- Follow Discord Developer ToS
- Follow Roblox Developer ToS
- Clear refund policy

---

**Last Updated:** January 2024  
**Version:** 1.0.0

**© 2024 XerionX Shop System. All rights reserved.**
