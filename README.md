# XerionX Bot - Setup Guide

## 📋 Overview

XerionX is a production-ready Discord bot featuring:
- **Modmail System** - DM forwarding to staff
- **Shop System** - Product management and purchases
- **Ticket System** - Support ticket creation
- **Roblox Integration** - API for purchase verification
- **Delivery System** - Automatic role/key/link delivery

---

## 🚀 Quick Start

### Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it "XerionX"
3. Go to the "Bot" section
4. Click "Reset Token" and copy your bot token
5. Enable these **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
   - ✅ Presence Intent (optional)

### Step 2: Invite Bot to Server

Use this URL (replace `YOUR_CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

**Required Permissions:**
- Manage Channels
- Manage Roles
- Send Messages
- Embed Links
- Read Message History
- Use Slash Commands

### Step 3: Configure the Bot

Edit `config.js` with your values:

```javascript
module.exports = {
    TOKEN: 'YOUR_BOT_TOKEN_HERE',           // From Discord Developer Portal
    GUILD_ID: 'YOUR_SERVER_ID_HERE',        // Right-click server > Copy ID
    
    CHANNELS: {
        MODMAIL_CHANNEL: 'CHANNEL_ID',      // Where modmail appears
        TICKET_LOG_CHANNEL: 'CHANNEL_ID',   // Ticket logs
        SHOP_LOG_CHANNEL: 'CHANNEL_ID'      // Purchase logs
    },
    
    ROLES: {
        STAFF_ROLE: 'ROLE_ID',              // Staff role ID
        ADMIN_ROLE: 'ROLE_ID'               // Admin role ID
    },
    
    ROBLOX: {
        API_KEY: 'CHANGE_THIS_SECRET_KEY',  // Change this!
        PORT: process.env.PORT || 3000
    },
    
    // ... rest of config
};
```

### Step 4: Get Channel & Role IDs

Enable Developer Mode in Discord:
1. User Settings > Advanced > Developer Mode
2. Right-click any channel/role > Copy ID

---

## 📦 Installation

### Local Development

```bash
# Install dependencies
npm install

# Start the bot
npm start
```

### WispBot Hosting

1. **Upload Files**: Upload all files to your WispBot panel
2. **Set Build Command**: `npm install`
3. **Set Start Command**: `node index.js`
4. **Environment Variables** (optional, overrides config.js):
   ```
   TOKEN=your_bot_token
   PORT=3000
   ```

### Other Hosting Platforms

The bot works on any Node.js hosting:
- **Heroku**: Set `TOKEN` in Config Vars
- **Railway**: Add environment variables
- **Replit**: Use Secrets tab
- **VPS**: Run with PM2: `pm2 start index.js --name xerionx`

---

## 🔧 Configuration Details

### Required IDs

| Setting | How to Get |
|---------|-----------|
| `TOKEN` | Discord Developer Portal > Bot > Reset Token |
| `GUILD_ID` | Right-click server icon > Copy ID |
| `MODMAIL_CHANNEL` | Create channel > Right-click > Copy ID |
| `STAFF_ROLE` | Create role > Right-click > Copy ID |
| `ADMIN_ROLE` | Create role > Right-click > Copy ID |

### Shop Products

Edit `SHOP_PRODUCTS` in `config.js`:

```javascript
SHOP_PRODUCTS: [
    {
        id: 'premium_1',
        name: 'Premium Membership',
        price: 9.99,
        description: '30 days of premium access',
        deliveryType: 'role',        // role, key, link, file
        deliveryValue: 'ROLE_ID'     // Role ID to give
    }
]
```

**Delivery Types:**
- `role` - Gives a Discord role (deliveryValue = role ID)
- `key` - Sends a license key (deliveryValue = the key text)
- `link` - Sends a download link (deliveryValue = URL)
- `file` - Sends a file (implementation needed)

---

## 🎮 Roblox Integration

### API Endpoint

```
POST /purchase
Content-Type: application/json

{
    "apiKey": "YOUR_SECRET_API_KEY",
    "userId": "123456789012345678",
    "productId": "premium_1",
    "robloxData": { ... }
}
```

### Response

```json
{
    "success": true,
    "message": "Purchase received and queued for delivery",
    "purchaseId": "PUR-xxxxxx"
}
```

### Security

- API key validation required
- Rate limiting (100 requests/minute/IP)
- Input validation for user IDs
- IP logging for audit

### Example Roblox Script

```lua
local HttpService = game:GetService("HttpService")
local API_URL = "http://your-bot-url:3000/purchase"
local API_KEY = "YOUR_SECRET_API_KEY"

local function sendPurchase(userId, productId)
    local data = HttpService:JSONEncode({
        apiKey = API_KEY,
        userId = userId,
        productId = productId
    })
    
    local success, response = pcall(function()
        return HttpService:PostAsync(API_URL, data)
    end)
    
    return success and HttpService:JSONDecode(response)
end
```

---

## 📝 Commands

### Public Commands

| Command | Description |
|---------|-------------|
| `/shop` | View available products |
| `/buy <product_id>` | Purchase a product |
| `/ticket` | Create support ticket |
| `/status` | Check bot status |

### Staff Commands

| Command | Description |
|---------|-------------|
| `/modmail <user_id> <message>` | Reply to modmail |
| `/modmail-close <user_id>` | Close modmail session |

### Admin Commands

| Command | Description |
|---------|-------------|
| `/add-product` | Add new shop product |
| `/remove-product <id>` | Remove shop product |

---

## 🔒 Security Best Practices

1. **Change the default API key** in config.js
2. **Keep your bot token secret** - never commit to Git
3. **Use role permissions** - only give Staff/Admin roles to trusted users
4. **Enable 2FA** on your Discord account
5. **Regular backups** of your configuration

---

## 🐛 Troubleshooting

### Bot won't start
- Check if token is correct in config.js
- Ensure Node.js version is 18+
- Run `npm install` to install dependencies

### Commands not appearing
- Wait a few minutes for slash commands to register
- Try kicking and re-inviting the bot
- Check bot has proper permissions

### Modmail not working
- Verify MODMAIL_CHANNEL exists and ID is correct
- Check bot has permission to send messages there
- Ensure Message Content intent is enabled

### API not responding
- Check if PORT is available
- Verify firewall allows incoming connections
- Check logs for errors

---

## 📁 File Structure

```
/workspace
├── index.js      # Main bot file
├── config.js     # Configuration
├── modmail.js    # Modmail system
├── shop.js       # Shop system
├── api.js        # Roblox API
├── utils.js      # Utility functions
├── package.json  # Dependencies
└── README.md     # This file
```

**No folders!** Flat structure for easy hosting deployment.

---

## 💡 Tips

1. **Test locally first** before deploying to production
2. **Use a separate test server** for development
3. **Monitor logs** for errors and security issues
4. **Backup config.js** before making changes
5. **Update regularly** for security patches

---

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review error logs in console
3. Verify all configuration values are correct
4. Ensure all required intents are enabled

---

**XerionX Bot v1.0.0** - Built for production, designed for simplicity.
