# XerionX Shop System

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/xerionx/shop-system)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)](https://discord.js.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)

## 🚀 Premium Discord Bot with Roblox Integration

A production-ready, fully automated shop system for selling digital products through Roblox with automatic Discord delivery.

![XerionX Shop System](https://via.placeholder.com/800x400/0099FF/FFFFFF?text=XerionX+Shop+System)

---

## ✨ Features

### 🔗 Account Linking
- Secure Discord ↔ Roblox account linking
- Unique verification code system
- Prevents duplicate linking
- 15-minute code expiration

### 🛒 Digital Shop
- Browse products by category
- Admin product upload via Discord
- Support for Dev Products & Gamepasses
- Multiple delivery methods (attachment, link, license key)

### 📦 Automatic Delivery
- Instant DM delivery after purchase
- File attachments or download links
- License key generation
- Delivery retry system

### 🎫 ModMail Support
- Users can DM bot for support
- Staff response system
- Ticket tracking

### 👮 Admin Panel
- Product management (`/upload`, `/removeproduct`)
- User management (`/ban`, `/unban`, `/linkcheck`)
- Sales statistics (`/stats`)
- Delivery logs

### 🔒 Security
- HMAC-SHA256 request signing
- Rate limiting on all endpoints
- Input sanitization
- Duplicate purchase prevention
- IP tracking

---

## 📁 Project Structure

```
xerionx-shop/
├── bot/                    # Discord Bot
│   ├── commands/          # Slash commands
│   │   ├── link.js
│   │   ├── shop.js
│   │   ├── upload.js
│   │   └── help.js
│   ├── events/            # Event handlers
│   │   ├── ready.js
│   │   ├── interactionCreate.js
│   │   └── messageCreate.js
│   ├── handlers/          # Bot handlers
│   │   ├── commandHandler.js
│   │   └── eventHandler.js
│   └── index.js           # Bot entry point
├── api/                   # Express API Server
│   ├── models/            # MongoDB schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Purchase.js
│   │   ├── Log.js
│   │   └── ModMail.js
│   ├── routes/            # API endpoints
│   │   ├── link.js
│   │   ├── purchase.js
│   │   ├── products.js
│   │   └── admin.js
│   ├── middleware/        # Express middleware
│   │   ├── auth.js
│   │   └── rateLimiter.js
│   ├── services/          # Business logic
│   │   ├── database.js
│   │   └── signature.js
│   └── server.js          # API entry point
├── roblox-scripts/        # Roblox Lua scripts
│   └── ShopIntegration.lua
├── docs/                  # Documentation
│   ├── SETUP_GUIDE.md
│   └── SECURITY.md
├── .env.example           # Environment template
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MongoDB
- Discord Bot Token
- Roblox Game with HTTP enabled

### Installation

```bash
# Clone repository
git clone https://github.com/xerionx/shop-system.git
cd xerionx-shop

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit with your values

# Start development
npm run dev

# Or start production
npm start
```

### Configuration

Edit `.env` with your credentials:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
MONGODB_URI=mongodb://localhost:27017/xerionx-shop
ROBLOX_API_SECRET=your_secret_key
ADMIN_IDS=your_discord_id
```

---

## 📖 Documentation

- **[Setup Guide](docs/SETUP_GUIDE.md)** - Complete installation instructions
- **[Security Documentation](docs/SECURITY.md)** - Security features and best practices
- **[API Reference](docs/API.md)** - API endpoint documentation

---

## 💡 Usage Examples

### User Commands

```
/link          - Link Discord to Roblox account
/shop          - Browse available products
/purchases     - View purchase history
/help          - Get help
```

### Admin Commands

```
/upload                      - Upload new product
/stats                       - View sales statistics
/ban @user [reason]         - Ban a user
/unban @user                - Unban a user
/linkcheck @user            - Check link status
/resenddelivery <id>        - Resend delivery
```

---

## 🔧 API Endpoints

### Account Linking
- `POST /api/link/request` - Request verification code
- `POST /api/link/verify` - Verify account link
- `GET /api/link/status/:discordId` - Check link status

### Purchases
- `POST /api/purchase/webhook` - Roblox purchase webhook
- `GET /api/purchase/history/:discordId` - Purchase history
- `GET /api/purchase/:purchaseId` - Purchase details

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - User management
- `POST /api/admin/users/:id/ban` - Ban user
- `GET /api/admin/logs` - System logs

---

## 🛡️ Security Features

| Feature | Description |
|---------|-------------|
| **HMAC Signing** | All Roblox requests signed with SHA256 |
| **Rate Limiting** | Tiered limits per endpoint |
| **Input Sanitization** | XSS and injection prevention |
| **Duplicate Prevention** | Transaction ID tracking |
| **Access Control** | Role-based permissions |
| **Logging** | Comprehensive audit trail |

See [SECURITY.md](docs/SECURITY.md) for details.

---

## 📊 Database Schema

### Collections

- **users** - Discord ↔ Roblox account mappings
- **products** - Shop product catalog
- **purchases** - Transaction history
- **logs** - System activity logs
- **modmail** - Support tickets

---

## 🎯 Roblox Integration

The included Lua script handles:

1. **Purchase Detection** - Intercepts `ProcessReceipt`
2. **Account Linking** - In-game `/getcode` and `/verify` commands
3. **API Communication** - Secure HTTP requests to backend
4. **Signature Generation** - HMAC signing for all requests

Place `ShopIntegration.lua` in `ServerScriptService`.

---

## 🚀 Deployment

### VPS (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start bot/index.js --name xerionx-bot
pm2 start api/server.js --name xerionx-api
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

Need help?

- 📖 Read the [Setup Guide](docs/SETUP_GUIDE.md)
- 🐛 Report bugs on GitHub Issues
- 💬 Contact support via Discord DM

---

## 🙏 Credits

- **Discord.js** - Discord library
- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **Roblox Corporation** - Roblox platform

---

## 📈 Roadmap

- [ ] Web dashboard for admins
- [ ] Multiple currency support
- [ ] Affiliate/referral system
- [ ] Advanced analytics
- [ ] REST API documentation
- [ ] Webhook notifications

---

**Made with ❤️ by XerionX**

**© 2024 XerionX Shop System. All rights reserved.**
