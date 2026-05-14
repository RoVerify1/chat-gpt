/**
 * XerionX Bot Configuration
 * 
 * All configuration values in one place.
 * For WispBot Hosting and similar platforms.
 * 
 * IMPORTANT: Replace the values below with your actual credentials.
 */

module.exports = {
    // Discord Bot Token (Get from https://discord.com/developers/applications)
    TOKEN: 'YOUR_BOT_TOKEN_HERE',
    
    // Discord Guild ID (Your server ID - right click server > Copy ID)
    GUILD_ID: 'YOUR_SERVER_ID_HERE',
    
    // Channel IDs
    CHANNELS: {
        // Where modmail messages appear for staff
        MODMAIL_CHANNEL: 'YOUR_MODMAIL_CHANNEL_ID',
        // Where ticket logs are sent
        TICKET_LOG_CHANNEL: 'YOUR_TICKET_LOG_CHANNEL_ID',
        // Where shop purchase logs are sent
        SHOP_LOG_CHANNEL: 'YOUR_SHOP_LOG_CHANNEL_ID'
    },
    
    // Role IDs
    ROLES: {
        // Staff role that can reply to modmail
        STAFF_ROLE: 'YOUR_STAFF_ROLE_ID',
        // Admin role that can manage shop
        ADMIN_ROLE: 'YOUR_ADMIN_ROLE_ID'
    },
    
    // Roblox Integration
    ROBLOX: {
        // API Key for securing /purchase endpoint
        API_KEY: 'YOUR_SECRET_API_KEY_CHANGE_THIS',
        // Port for Express server (WispBot usually provides PORT env var)
        PORT: process.env.PORT || 3000
    },
    
    // Bot Settings
    BOT: {
        NAME: 'XerionX',
        PREFIX: '!',
        EMBED_COLOR: 0x5865F2 // Discord Blurple
    },
    
    // Shop Products (Example - modify as needed)
    SHOP_PRODUCTS: [
        {
            id: 'premium_1',
            name: 'Premium Membership',
            price: 9.99,
            description: '30 days of premium access',
            deliveryType: 'role', // role, file, key, link
            deliveryValue: 'YOUR_PREMIUM_ROLE_ID'
        },
        {
            id: 'vip_1',
            name: 'VIP Package',
            price: 19.99,
            description: 'Lifetime VIP status with exclusive perks',
            deliveryType: 'role',
            deliveryValue: 'YOUR_VIP_ROLE_ID'
        }
    ],
    
    // MongoDB (Optional - leave empty to disable)
    MONGODB_URI: '' // e.g., 'mongodb://localhost:27017/xerionx'
};
