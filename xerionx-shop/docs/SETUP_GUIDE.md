# XerionX Shop System - Setup Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Discord Bot Setup](#discord-bot-setup)
5. [Roblox Integration](#roblox-integration)
6. [Database Setup](#database-setup)
7. [Running the System](#running-the-system)
8. [Admin Commands](#admin-commands)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up the XerionX Shop System, ensure you have:

- **Node.js** v18+ installed ([Download](https://nodejs.org/))
- **MongoDB** installed and running ([Download](https://www.mongodb.com/try/download/community))
- **Discord Application** with bot created ([Discord Developer Portal](https://discord.com/developers/applications))
- **Roblox Game** with HTTP requests enabled
- **Git** (optional, for version control)

### Required Permissions

**Discord Bot Permissions:**
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Use Slash Commands
- Direct Messages

---

## Installation

### 1. Clone or Download the Project

```bash
cd /workspace/xerionx-shop
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- discord.js v14
- Express.js
- Mongoose
- And other dependencies

### 3. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Configuration](#configuration))

---

## Configuration

### Environment Variables (.env)

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_guild_id_here  # Optional but recommended

# API Configuration
API_PORT=3001
API_HOST=localhost
API_SECRET_KEY=generate_a_secure_random_string_here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/xerionx-shop

# Roblox Integration
ROBLOX_API_SECRET=generate_another_secure_random_string_here
ROBLOX_GAME_ID=your_roblox_game_id_here
ROBLOX_UNIVERSE_ID=your_roblox_universe_id_here

# File Storage
FILE_STORAGE_PATH=./uploads
MAX_FILE_SIZE_MB=50

# Admin Discord IDs (comma-separated)
ADMIN_IDS=your_discord_user_id_here,other_admin_ids

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Generating Secure Keys

Generate secure random strings for your secrets:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice - once for `API_SECRET_KEY` and once for `ROBLOX_API_SECRET`

---

## Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "XerionX Shop" or your preferred name

### 2. Create Bot

1. Go to "Bot" section
2. Click "Add Bot"
3. Under "Token", click "Reset Token" and copy it
4. Paste the token in `.env` as `DISCORD_TOKEN`

### 3. Enable Privileged Intents

In the Bot settings, enable:
- ✅ Server Members Intent
- ✅ Message Content Intent

### 4. Get Client ID

1. Go to "General Information"
2. Copy "Application ID"
3. Paste in `.env` as `DISCORD_CLIENT_ID`

### 5. Invite Bot to Server

Create invite URL:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Replace `YOUR_CLIENT_ID` with your actual Client ID.

### 6. Add Bot to Your Server

1. Open the URL in browser
2. Select your server
3. Authorize

### 7. Get Guild ID (Optional but Recommended)

1. In Discord, enable Developer Mode (User Settings > Advanced > Developer Mode)
2. Right-click your server icon
3. Click "Copy Server ID"
4. Paste in `.env` as `DISCORD_GUILD_ID`

---

## Roblox Integration

### 1. Enable HTTP Requests

1. Open your Roblox game in Roblox Studio
2. Go to Home > Game Settings > Security
3. Enable "Allow HTTP Requests"
4. Save

### 2. Insert the Script

1. In Roblox Studio, go to ServerScriptService
2. Create a new Script
3. Paste the content from `roblox-scripts/ShopIntegration.lua`
4. Update the configuration:
   ```lua
   local CONFIG = {
       ApiBaseUrl = "https://your-domain.com/api",
       ApiSecret = "your_roblox_api_secret_from_env",
       GameId = game.GameId,
       UniverseId = game.UniverseId
   }
   ```

### 3. Create Dev Products / Gamepasses

1. Go to Creations > Developer Products (or Gamepasses)
2. Create products for each item you want to sell
3. Note down the Product IDs
4. These IDs will be used when uploading products via Discord

---

## Database Setup

### MongoDB Installation

#### Windows
```bash
# Download from https://www.mongodb.com/try/download/community
# Install and run as service
```

#### Linux (Ubuntu)
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Verify MongoDB is Running

```bash
mongosh
# Should connect successfully
```

---

## Running the System

### Development Mode

Run both bot and API with hot-reload:

```bash
npm run dev
```

### Production Mode

```bash
# Run bot
npm run start:bot

# In another terminal, run API
npm run start:api

# Or run both together
npm start
```

### Using PM2 (Recommended for Production)

```bash
npm install -g pm2

pm2 start bot/index.js --name xerionx-bot
pm2 start api/server.js --name xerionx-api
pm2 save
pm2 startup
```

---

## Admin Commands

### Discord Commands

**Product Management:**
- `/upload` - Upload a new product with file attachment
- `/removeproduct <id>` - Remove/deactivate a product
- `/editproduct <id>` - Edit product details

**User Management:**
- `/ban @user [reason]` - Ban a user from the shop
- `/unban @user` - Unban a user
- `/linkcheck @user` - Check a user's link status

**Analytics:**
- `/stats` - View sales statistics
- `/logs [action]` - View system logs

**Support:**
- `/resenddelivery <purchase_id>` - Resend a purchase delivery

### Usage Examples

#### Uploading a Product

1. Use `/upload` command
2. Fill in the form:
   - Name: "Premium Script Pack"
   - Description: "High-quality scripts for your game"
   - Price: 100 (Robux)
   - Product ID: "12345678" (from Roblox Dev Product)
   - Type: Dev Product
   - File: Attach your zip file
   - Category: Scripts
   - Delivery: Attachment

3. Submit - Product is now available!

#### Checking Link Status

Use `/linkcheck @username` to see if a user has linked their accounts.

---

## Security

### Implemented Security Measures

1. **API Signature Verification**
   - All Roblox requests must include HMAC-SHA256 signature
   - Timestamp validation (5-minute window)
   - Prevents replay attacks

2. **Rate Limiting**
   - General API: 100 requests per 15 minutes
   - Purchase endpoint: 10 requests per minute
   - Account linking: 5 attempts per 15 minutes

3. **Input Sanitization**
   - All inputs are sanitized
   - XSS prevention
   - SQL injection prevention (via Mongoose)

4. **Access Control**
   - Admin commands require specific Discord IDs
   - Users must be linked to access shop
   - Banned users are blocked

5. **Secure File Handling**
   - File type validation
   - Size limits
   - No direct file access without purchase

### Best Practices

1. **Never commit `.env` file** - It contains secrets
2. **Use HTTPS in production** - Never expose HTTP API
3. **Rotate secrets regularly** - Change API keys periodically
4. **Monitor logs** - Check for suspicious activity
5. **Backup database** - Regular MongoDB backups

---

## Troubleshooting

### Bot Won't Start

**Error: Invalid token**
- Check `DISCORD_TOKEN` in `.env`
- Ensure no extra spaces or quotes

**Error: Intents missing**
- Enable privileged intents in Discord Developer Portal
- Restart bot after enabling

### API Won't Connect

**Error: MongoDB connection failed**
- Ensure MongoDB is running: `sudo systemctl status mongod`
- Check `MONGODB_URI` in `.env`
- Try: `mongosh` to verify connection

**Error: Port already in use**
- Change `API_PORT` in `.env`
- Or kill process: `lsof -ti:3001 | xargs kill`

### Purchases Not Delivering

1. Check if user is linked: `/linkcheck @user`
2. Verify Roblox Product ID matches
3. Check API logs for errors
4. Ensure webhook URL is correct in Roblox script

### Account Linking Issues

**Code not working:**
- Ensure code hasn't expired (15 minutes)
- Check API logs for verification errors
- Verify `ROBLOX_API_SECRET` matches on both sides

### File Upload Fails

- Check file size limit (`MAX_FILE_SIZE_MB`)
- Verify file type is allowed
- Ensure `uploads/` directory exists and is writable

---

## Support

For issues or questions:

1. Check this documentation first
2. Review error logs in `logs/` directory
3. Contact XerionX support via Discord DM

---

## Deployment Guide (VPS)

### Ubuntu VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Git and clone repo
sudo apt install git
git clone your-repo-url
cd xerionx-shop

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit with your values

# Install PM2
sudo npm install -g pm2

# Start services
pm2 start bot/index.js --name xerionx-bot
pm2 start api/server.js --name xerionx-api
pm2 save
pm2 startup

# Setup Nginx (for HTTPS)
sudo apt install nginx
sudo nano /etc/nginx/sites-available/xerionx

# Nginx config:
server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

**© 2024 XerionX Shop System. All rights reserved.**
