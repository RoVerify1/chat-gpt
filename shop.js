/**
 * XerionX Shop System
 * Product management and purchase handling
 */

const { EmbedBuilder } = require('discord.js');
const config = require('./config');
const utils = require('./utils');

// In-memory product storage (extends config)
let products = [...config.SHOP_PRODUCTS];

/**
 * Get all products
 */
function getAllProducts() {
    return products;
}

/**
 * Get product by ID
 */
function getProductById(productId) {
    return products.find(p => p.id === productId);
}

/**
 * Add new product (admin only)
 */
function addProduct(product) {
    const requiredFields = ['id', 'name', 'price', 'description', 'deliveryType', 'deliveryValue'];
    for (const field of requiredFields) {
        if (!product[field]) {
            return { success: false, message: `Missing required field: ${field}` };
        }
    }
    
    // Check if ID already exists
    if (products.find(p => p.id === product.id)) {
        return { success: false, message: 'Product ID already exists' };
    }
    
    products.push(product);
    utils.log(`Product added: ${product.name} (${product.id})`, 'SHOP');
    return { success: true, message: 'Product added successfully', product };
}

/**
 * Remove product by ID (admin only)
 */
function removeProduct(productId) {
    const index = products.findIndex(p => p.id === productId);
    
    if (index === -1) {
        return { success: false, message: 'Product not found' };
    }
    
    const removed = products.splice(index, 1)[0];
    utils.log(`Product removed: ${removed.name} (${productId})`, 'SHOP');
    return { success: true, message: 'Product removed successfully', product: removed };
}

/**
 * Create shop embed
 */
function createShopEmbed() {
    const embed = new EmbedBuilder()
        .setColor(config.BOT.EMBED_COLOR)
        .setTitle('🛒 XerionX Shop')
        .setDescription('Welcome to our shop! Browse available products below.\n\nUse `!buy <product_id>` to purchase.')
        .setFooter({ text: `XerionX Shop • ${products.length} products available` })
        .setTimestamp();
    
    if (products.length === 0) {
        embed.addFields({ name: 'No Products', value: 'No products are currently available.' });
        return embed;
    }
    
    const productFields = products.map(p => ({
        name: `**${p.name}** - ${utils.formatCurrency(p.price)}`,
        value: `${p.description}\n*ID: \`${p.id}\`*`,
        inline: false
    }));
    
    embed.addFields(...productFields);
    return embed;
}

/**
 * Process purchase (called after Roblox verification)
 */
async function processPurchase(client, userId, productId) {
    const product = getProductById(productId);
    
    if (!product) {
        return { success: false, message: 'Product not found' };
    }
    
    try {
        const user = await client.users.fetch(userId);
        const guild = client.guilds.cache.get(config.GUILD_ID);
        
        let deliveryMessage = '';
        
        // Handle different delivery types
        switch (product.deliveryType) {
            case 'role':
                if (guild && product.deliveryValue) {
                    const member = await guild.members.fetch(userId).catch(() => null);
                    if (member) {
                        await member.roles.add(product.deliveryValue);
                        deliveryMessage = `✅ You have been granted the **${product.name}** role!`;
                    } else {
                        deliveryMessage = `⚠️ You received **${product.name}** but couldn't be added to the server.`;
                    }
                } else {
                    deliveryMessage = `✅ Purchase confirmed: **${product.name}**`;
                }
                break;
                
            case 'key':
                deliveryMessage = `🔑 Your license key for **${product.name}**:\n\`\`\`${product.deliveryValue}\`\`\``;
                break;
                
            case 'link':
                deliveryMessage = `🔗 Download link for **${product.name}**:\n${product.deliveryValue}`;
                break;
                
            case 'file':
                deliveryMessage = `📎 Your **${product.name}** file is attached below.`;
                break;
                
            default:
                deliveryMessage = `✅ Purchase confirmed: **${product.name}**`;
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎉 Purchase Successful!')
            .setDescription(deliveryMessage)
            .addFields(
                { name: 'Product', value: product.name, inline: true },
                { name: 'Price', value: utils.formatCurrency(product.price), inline: true }
            )
            .setFooter({ text: 'Thank you for your purchase!' })
            .setTimestamp();
        
        await user.send({ embeds: [embed] });
        
        // Log to shop channel
        const logChannel = client.channels.cache.get(config.CHANNELS.SHOP_LOG_CHANNEL);
        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor(config.BOT.EMBED_COLOR)
                .setTitle('💰 New Purchase')
                .addFields(
                    { name: 'User', value: `${user.tag} (${userId})`, inline: true },
                    { name: 'Product', value: product.name, inline: true },
                    { name: 'Price', value: utils.formatCurrency(product.price), inline: true }
                )
                .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] });
        }
        
        utils.log(`Purchase delivered: ${product.name} to ${user.tag}`, 'SHOP');
        return { success: true, message: 'Purchase processed successfully' };
    } catch (error) {
        utils.log(`Purchase delivery failed: ${error.message}`, 'ERROR');
        return { success: false, message: `Delivery failed: ${error.message}` };
    }
}

module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    removeProduct,
    createShopEmbed,
    processPurchase
};
