/**
 * XerionX Bot - Main Entry Point
 * Production-ready Discord bot with Modmail, Shop, Tickets & Roblox Integration
 * 
 * Compatible with WispBot Hosting and similar platforms
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');
const utils = require('./utils');
const modmail = require('./modmail');
const shop = require('./shop');
const api = require('./api');

// Initialize global purchase queue
global.purchaseQueue = [];

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

// Command collection
client.commands = new Collection();

/**
 * Register slash commands
 */
async function registerCommands() {
    const { REST, Routes } = require('discord.js');
    
    const commands = [
        {
            name: 'shop',
            description: 'View available products in the shop'
        },
        {
            name: 'buy',
            description: 'Purchase a product',
            options: [{
                name: 'product_id',
                description: 'The ID of the product to purchase',
                type: 3, // STRING
                required: true
            }]
        },
        {
            name: 'ticket',
            description: 'Create a support ticket'
        },
        {
            name: 'close',
            description: 'Close your current ticket'
        },
        {
            name: 'modmail',
            description: 'Reply to a modmail conversation',
            options: [
                {
                    name: 'user_id',
                    description: 'Discord user ID to reply to',
                    type: 3, // STRING
                    required: true
                },
                {
                    name: 'message',
                    description: 'Your reply message',
                    type: 3, // STRING
                    required: true
                }
            ]
        },
        {
            name: 'modmail-close',
            description: 'Close a modmail conversation',
            options: [{
                name: 'user_id',
                description: 'Discord user ID whose conversation to close',
                type: 3, // STRING
                required: true
            }]
        },
        {
            name: 'add-product',
            description: 'Add a new product to the shop (Admin only)',
            options: [
                { name: 'id', description: 'Product ID', type: 3, required: true },
                { name: 'name', description: 'Product name', type: 3, required: true },
                { name: 'price', description: 'Product price', type: 4, required: true },
                { name: 'description', description: 'Product description', type: 3, required: true },
                { name: 'delivery_type', description: 'Delivery type (role/key/link/file)', type: 3, required: true },
                { name: 'delivery_value', description: 'Delivery value (role ID, key, link, etc)', type: 3, required: true }
            ]
        },
        {
            name: 'remove-product',
            description: 'Remove a product from the shop (Admin only)',
            options: [{
                name: 'product_id',
                description: 'ID of the product to remove',
                type: 3,
                required: true
            }]
        },
        {
            name: 'status',
            description: 'Check bot status and stats'
        }
    ];
    
    try {
        const rest = new REST({ version: '10' }).setToken(config.TOKEN);
        
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, config.GUILD_ID),
            { body: commands }
        );
        
        utils.log('Slash commands registered successfully', 'BOT');
    } catch (error) {
        utils.log(`Failed to register commands: ${error.message}`, 'ERROR');
    }
}

/**
 * Handle interactions
 */
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    
    const { commandName, user, member } = interaction;
    
    try {
        switch (commandName) {
            case 'shop': {
                const embed = shop.createShopEmbed();
                await interaction.reply({ embeds: [embed] });
                break;
            }
            
            case 'buy': {
                const productId = interaction.options.getString('product_id');
                const product = shop.getProductById(productId);
                
                if (!product) {
                    return interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('❌ Product Not Found')
                            .setDescription(`No product found with ID: \`${productId}\``)],
                        ephemeral: true
                    });
                }
                
                const embed = new EmbedBuilder()
                    .setColor(config.BOT.EMBED_COLOR)
                    .setTitle('🛒 Confirm Purchase')
                    .setDescription(`Are you sure you want to purchase **${product.name}**?`)
                    .addFields(
                        { name: 'Price', value: utils.formatCurrency(product.price), inline: true },
                        { name: 'Description', value: product.description, inline: false }
                    );
                
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`buy_confirm_${productId}`)
                            .setLabel('Confirm Purchase')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('buy_cancel')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Secondary)
                    );
                
                await interaction.reply({ embeds: [embed], components: [row] });
                break;
            }
            
            case 'ticket': {
                // Simple ticket creation
                const ticketId = utils.generateTicketId();
                const guild = client.guilds.cache.get(config.GUILD_ID);
                
                if (!guild) {
                    return interaction.reply({ content: '❌ Guild not found', ephemeral: true });
                }
                
                // Try to find or create tickets channel
                let ticketsChannel = guild.channels.cache.find(c => c.name === 'tickets' && c.type === 0);
                
                if (!ticketsChannel) {
                    ticketsChannel = await guild.channels.create({
                        name: 'tickets',
                        type: 0,
                        topic: 'Support tickets channel'
                    });
                }
                
                const embed = new EmbedBuilder()
                    .setColor(config.BOT.EMBED_COLOR)
                    .setTitle(`🎫 Support Ticket: ${ticketId}`)
                    .setDescription(`**Created by:** ${user.tag}\n**Created:** <t:${Math.floor(Date.now() / 1000)}:R>\n\nPlease describe your issue and a staff member will assist you.`)
                    .setFooter({ text: `Ticket ID: ${ticketId}` })
                    .setTimestamp();
                
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`ticket_close_${ticketId}`)
                            .setLabel('Close Ticket')
                            .setStyle(ButtonStyle.Danger)
                    );
                
                const ticketMessage = await ticketsChannel.send({
                    content: `🔔 New ticket from ${user.tag}`,
                    embeds: [embed],
                    components: [row]
                });
                
                // Log to ticket log channel
                const logChannel = client.channels.cache.get(config.CHANNELS.TICKET_LOG_CHANNEL);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(config.BOT.EMBED_COLOR)
                        .setTitle('🎫 Ticket Created')
                        .addFields(
                            { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                            { name: 'Ticket ID', value: ticketId, inline: true }
                        )
                        .setTimestamp();
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
                
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('✅ Ticket Created')
                        .setDescription(`Your ticket has been created in ${ticketsChannel}`)],
                    ephemeral: true
                });
                
                utils.log(`Ticket created: ${ticketId} by ${user.tag}`, 'TICKET');
                break;
            }
            
            case 'close': {
                // Close ticket (simplified - in channel context)
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xFFA500)
                        .setDescription('🔒 To close this ticket, click the "Close Ticket" button in the ticket channel.')],
                    ephemeral: true
                });
                break;
            }
            
            case 'modmail': {
                // Check if user is staff
                if (!utils.isStaff(member)) {
                    return interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('❌ Permission Denied')
                            .setDescription('You need the Staff role to use this command.')],
                        ephemeral: true
                    });
                }
                
                const targetUserId = interaction.options.getString('user_id');
                const message = interaction.options.getString('message');
                
                const result = await modmail.replyToUser(client, targetUserId, message, user);
                
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(result.success ? 0x00FF00 : 0xFF0000)
                        .setTitle(result.success ? '✅ Reply Sent' : '❌ Failed')
                        .setDescription(result.message)],
                    ephemeral: !result.success
                });
                break;
            }
            
            case 'modmail-close': {
                if (!utils.isStaff(member)) {
                    return interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('❌ Permission Denied')
                            .setDescription('You need the Staff role to use this command.')],
                        ephemeral: true
                    });
                }
                
                const targetUserId = interaction.options.getString('user_id');
                const result = await modmail.closeSession(targetUserId, client);
                
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(result.success ? 0x00FF00 : 0xFF0000)
                        .setTitle(result.success ? '✅ Session Closed' : '❌ Failed')
                        .setDescription(result.message)],
                    ephemeral: !result.success
                });
                break;
            }
            
            case 'add-product': {
                if (!utils.isAdmin(member)) {
                    return interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('❌ Permission Denied')
                            .setDescription('You need the Admin role to use this command.')],
                        ephemeral: true
                    });
                }
                
                const product = {
                    id: interaction.options.getString('id'),
                    name: interaction.options.getString('name'),
                    price: interaction.options.getNumber('price'),
                    description: interaction.options.getString('description'),
                    deliveryType: interaction.options.getString('delivery_type'),
                    deliveryValue: interaction.options.getString('delivery_value')
                };
                
                const validTypes = ['role', 'key', 'link', 'file'];
                if (!validTypes.includes(product.deliveryType)) {
                    return interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription(`Invalid delivery type. Must be one of: ${validTypes.join(', ')}`)],
                        ephemeral: true
                    });
                }
                
                const result = shop.addProduct(product);
                
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(result.success ? 0x00FF00 : 0xFF0000)
                        .setTitle(result.success ? '✅ Product Added' : '❌ Failed')
                        .setDescription(result.message)],
                    ephemeral: !result.success
                });
                break;
            }
            
            case 'remove-product': {
                if (!utils.isAdmin(member)) {
                    return interaction.reply({
                        embeds: [new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('❌ Permission Denied')
                            .setDescription('You need the Admin role to use this command.')],
                        ephemeral: true
                    });
                }
                
                const productId = interaction.options.getString('product_id');
                const result = shop.removeProduct(productId);
                
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(result.success ? 0x00FF00 : 0xFF0000)
                        .setTitle(result.success ? '✅ Product Removed' : '❌ Failed')
                        .setDescription(result.message)],
                    ephemeral: !result.success
                });
                break;
            }
            
            case 'status': {
                const guild = client.guilds.cache.get(config.GUILD_ID);
                const sessions = modmail.getActiveSessions();
                
                const embed = new EmbedBuilder()
                    .setColor(config.BOT.EMBED_COLOR)
                    .setTitle('🤖 XerionX Bot Status')
                    .addFields(
                        { name: 'Bot Name', value: config.BOT.NAME, inline: true },
                        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
                        { name: 'Users', value: `${client.users.cache.size}`, inline: true },
                        { name: 'Active Modmail Sessions', value: `${sessions.length}`, inline: true },
                        { name: 'Products Available', value: `${shop.getAllProducts().length}`, inline: true },
                        { name: 'Uptime', value: `<t:${Math.floor((Date.now() - client.uptime) / 1000)}:R>`, inline: true }
                    )
                    .setFooter({ text: 'XerionX Bot v1.0.0' })
                    .setTimestamp();
                
                if (guild) {
                    embed.addFields({ name: 'Current Guild', value: guild.name, inline: false });
                }
                
                await interaction.reply({ embeds: [embed] });
                break;
            }
        }
    } catch (error) {
        utils.log(`Interaction error (${commandName}): ${error.message}`, 'ERROR');
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while processing this command.',
                ephemeral: true
            }).catch(() => {});
        }
    }
});

/**
 * Handle button interactions
 */
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    
    const customId = interaction.customId;
    
    try {
        if (customId.startsWith('buy_confirm_')) {
            const productId = customId.replace('buy_confirm_', '');
            const product = shop.getProductById(productId);
            
            if (!product) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Product no longer available')],
                    ephemeral: true
                });
            }
            
            // Disable buttons
            await interaction.update({ components: [] });
            
            // Process purchase (in production, this would verify payment first)
            const result = await shop.processPurchase(client, interaction.user.id, productId);
            
            await interaction.followUp({
                embeds: [new EmbedBuilder()
                    .setColor(result.success ? 0x00FF00 : 0xFF0000)
                    .setDescription(result.success ? '✅ Purchase successful! Check your DMs for delivery.' : `❌ ${result.message}`)],
                ephemeral: true
            });
        } else if (customId === 'buy_cancel') {
            await interaction.update({ components: [] });
            await interaction.followUp({
                embeds: [new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setDescription('⚠️ Purchase cancelled')],
                ephemeral: true
            });
        } else if (customId === 'close_modmail') {
            if (!utils.isStaff(interaction.member)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Only staff can close modmail conversations')],
                    ephemeral: true
                });
            }
            
            // Find user ID from footer
            const embed = interaction.message.embeds.find(e => e.footer?.text?.includes('User ID:'));
            if (embed) {
                const userId = embed.footer.text.split('User ID:')[1].trim();
                await modmail.closeSession(userId, client);
            }
            
            await interaction.deferUpdate();
        } else if (customId.startsWith('ticket_close_')) {
            if (!utils.isStaff(interaction.member)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Only staff can close tickets')],
                    ephemeral: true
                });
            }
            
            await interaction.message.delete();
            
            const logChannel = client.channels.cache.get(config.CHANNELS.TICKET_LOG_CHANNEL);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🗑️ Ticket Closed')
                    .setDescription(`Ticket closed by ${interaction.user.tag}`)
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
            }
        }
    } catch (error) {
        utils.log(`Button interaction error: ${error.message}`, 'ERROR');
    }
});

/**
 * Handle direct messages (Modmail)
 */
client.on('messageCreate', async message => {
    // Handle DMs for modmail
    if (message.channel.type === 1) { // DM channel
        await modmail.handleUserDM(client, message);
    }
});

/**
 * Process purchase queue
 */
setInterval(async () => {
    if (global.purchaseQueue.length > 0) {
        const purchase = global.purchaseQueue.shift();
        utils.log(`Processing queued purchase: ${purchase.productId} -> ${purchase.userId}`, 'SHOP');
        await shop.processPurchase(client, purchase.userId, purchase.productId);
    }
}, 1000);

/**
 * Bot ready event
 */
client.once('ready', async () => {
    utils.log(`${config.BOT.NAME} is online!`, 'BOT');
    utils.log(`Logged in as ${client.user.tag}`, 'BOT');
    utils.log(`Serving ${client.guilds.cache.size} guild(s)`, 'BOT');
    
    // Set activity
    client.user.setPresence({
        activities: [{ name: '!shop • XerionX', type: 2 }], // Type 2 = LISTENING
        status: 'online'
    });
    
    // Register commands
    await registerCommands();
    
    // Start API server
    api.startServer(client);
});

/**
 * Error handling
 */
process.on('unhandledRejection', error => {
    utils.log(`Unhandled promise rejection: ${error.message}`, 'ERROR');
    console.error(error);
});

process.on('uncaughtException', error => {
    utils.log(`Uncaught exception: ${error.message}`, 'ERROR');
    console.error(error);
});

/**
 * Login
 */
if (!config.TOKEN || config.TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.error('❌ ERROR: Bot token not configured!');
    console.error('Please edit config.js and add your Discord bot token.');
    process.exit(1);
}

client.login(config.TOKEN);
