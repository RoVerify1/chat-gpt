/**
 * Event: Interaction Create - Verarbeitet Buttons, Select Menus und Modals
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('./config');
const EmbedFactory = require('./embeds');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    name: 'interactionCreate',
    
    async execute(interaction, client) {
        // Handle Button Interactions
        if (interaction.isButton()) {
            await handleButton(interaction, client);
        }
        
        // Handle Select Menu Interactions
        if (interaction.isStringSelectMenu()) {
            await handleSelectMenu(interaction, client);
        }
        
        // Handle Modal Submit
        if (interaction.isModalSubmit()) {
            await handleModal(interaction, client);
        }
    }
};

/**
 * Verarbeitet Button Klicks
 */
async function handleButton(interaction, client) {
    const customId = interaction.customId;
    
    try {
        // Ticket System Buttons
        if (customId.startsWith('ticket_')) {
            await handleTicketButton(interaction, client);
            return;
        }
        
        // Shop System Buttons
        if (customId.startsWith('shop_')) {
            await handleShopButton(interaction, client);
            return;
        }
        
        // Moderation Buttons
        if (customId.startsWith('mod_')) {
            await handleModButton(interaction, client);
            return;
        }
        
    } catch (error) {
        logger.error(`Fehler bei Button ${customId}:`, error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                embeds: [EmbedFactory.createErrorEmbed('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')],
                ephemeral: true
            }).catch(() => {});
        }
    }
}

/**
 * Verarbeitet Select Menu Auswahl
 */
async function handleSelectMenu(interaction, client) {
    const customId = interaction.customId;
    
    try {
        // Shop Kategorie Select
        if (customId === 'shop_category') {
            await handleShopCategorySelect(interaction, client);
            return;
        }
        
        // Ticket Kategorie Select
        if (customId === 'ticket_category') {
            await handleTicketCategorySelect(interaction, client);
            return;
        }
        
        // Help Kategorie Select
        if (customId === 'help_category') {
            await handleHelpCategorySelect(interaction, client);
            return;
        }
        
    } catch (error) {
        logger.error(`Fehler bei Select Menu ${customId}:`, error);
    }
}

/**
 * Verarbeitet Modal Submits
 */
async function handleModal(interaction, client) {
    const customId = interaction.customId;
    
    try {
        // Kauf Modal
        if (customId === 'buy_modal') {
            await handleBuyModal(interaction, client);
            return;
        }
        
        // Report Modal
        if (customId === 'report_modal') {
            await handleReportModal(interaction, client);
            return;
        }
        
        // Application Modal
        if (customId === 'application_modal') {
            await handleApplicationModal(interaction, client);
            return;
        }
        
    } catch (error) {
        logger.error(`Fehler bei Modal ${customId}:`, error);
    }
}

/**
 * Ticket Button Handler
 */
async function handleTicketButton(interaction, client) {
    const { Ticket } = require('./database');
    
    if (interaction.customId === 'ticket_close') {
        // Bestätige Close mit Modal oder direkt
        const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_close_confirm')
                .setLabel('Ja, schließen')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('ticket_close_cancel')
                .setLabel('Abbrechen')
                .setStyle(ButtonStyle.Secondary)
        );
        
        await interaction.reply({
            content: 'Möchtest du dieses Ticket wirklich schließen?',
            components: [confirmRow],
            ephemeral: true
        });
        return;
    }
    
    if (interaction.customId === 'ticket_close_confirm') {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        
        if (ticket) {
            ticket.status = 'closed';
            ticket.closedAt = new Date();
            ticket.closedBy = interaction.user.id;
            await ticket.save();
            
            // Erstelle Transcript
            const transcript = await createTranscript(interaction.channel, ticket);
            
            await interaction.channel.send({
                embeds: [EmbedFactory.createSuccessEmbed(`Ticket geschlossen! Transcript: ${transcript}`)]
            });
            
            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 5000);
        }
        
        await interaction.update({ content: 'Ticket wird geschlossen...', components: [] }).catch(() => {});
        return;
    }
    
    if (interaction.customId === 'ticket_claim') {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        
        if (ticket) {
            ticket.claimedBy = interaction.user.id;
            ticket.status = 'claimed';
            await ticket.save();
            
            await interaction.channel.setTopic(`Beansprucht von ${interaction.user.tag}`).catch(() => {});
            
            await interaction.reply({
                embeds: [EmbedFactory.createSuccessEmbed(`Ticket von ${interaction.user} beansprucht!`)],
                ephemeral: false
            });
        }
        return;
    }
    
    if (interaction.customId === 'ticket_reopen') {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        
        if (ticket) {
            ticket.status = 'open';
            ticket.claimedBy = null;
            await ticket.save();
            
            await interaction.reply({
                embeds: [EmbedFactory.createSuccessEmbed('Ticket wurde wieder geöffnet!')]
            });
        }
        return;
    }
    
    if (interaction.customId === 'ticket_delete') {
        // Nur für Admins
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                embeds: [EmbedFactory.createErrorEmbed('Du hast keine Berechtigung dafür.')],
                ephemeral: true
            });
        }
        
        await interaction.channel.delete();
        return;
    }
}

/**
 * Shop Button Handler
 */
async function handleShopButton(interaction, client) {
    const { Product, Order, User } = require('./database');
    
    if (interaction.customId.startsWith('shop_buy_')) {
        const productId = interaction.customId.replace('shop_buy_', '');
        const product = await Product.findOne({ productId });
        
        if (!product) {
            return interaction.reply({
                embeds: [EmbedFactory.createErrorEmbed('Produkt nicht gefunden!')],
                ephemeral: true
            });
        }
        
        if (product.stock === 0) {
            return interaction.reply({
                embeds: [EmbedFactory.createErrorEmbed('Produkt ausverkauft!')],
                ephemeral: true
            });
        }
        
        // Zeige Kaufbestätigungs-Modal
        const modal = new ModalBuilder()
            .setCustomId('buy_modal')
            .setTitle(`${config.emojis.shop} ${product.name} kaufen`);
        
        const quantityInput = new TextInputBuilder()
            .setCustomId('quantity')
            .setLabel('Anzahl')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('1')
            .setRequired(false)
            .setMinLength(1)
            .setMaxLength(3);
        
        const row = new ActionRowBuilder().addComponents(quantityInput);
        modal.addComponents(row);
        
        // Speichere Produkt-ID im Modal (via hidden field workaround)
        interaction.client.pendingPurchases = interaction.client.pendingPurchases || {};
        interaction.client.pendingPurchases[interaction.user.id] = productId;
        
        await interaction.showModal(modal);
        return;
    }
    
    if (interaction.customId === 'shop_refresh') {
        // Refresh shop view
        await interaction.deferUpdate();
        // Hier könnte man das Shop Embed neu laden
        return;
    }
}

/**
 * Shop Kategorie Select Handler
 */
async function handleShopCategorySelect(interaction, client) {
    const { Product } = require('./database');
    const selectedCategory = interaction.values[0];
    
    await interaction.deferUpdate();
    
    const products = await Product.find({ 
        category: selectedCategory, 
        enabled: true 
    }).limit(10);
    
    if (products.length === 0) {
        return interaction.followUp({
            embeds: [EmbedFactory.createInfoEmbed('Keine Produkte in dieser Kategorie gefunden.')],
            ephemeral: true
        });
    }
    
    const embed = EmbedFactory.createBaseEmbed({
        color: config.colors.premium,
        title: `${config.shopCategories.find(c => c.id === selectedCategory)?.icon} ${selectedCategory}`,
        description: `Hier sind alle Produkte in dieser Kategorie:`
    });
    
    products.forEach((product, index) => {
        const price = product.discount > 0 
            ? `~~${product.price}~~ **${Math.round(product.price * (1 - product.discount / 100))}**`
            : `**${product.price}**`;
        
        embed.addFields({
            name: `${index + 1}. ${product.name}`,
            value: `${price} ${product.currency} | ID: \`${product.productId}\``,
            inline: false
        });
    });
    
    const buyButtons = products.map(p => 
        new ButtonBuilder()
            .setCustomId(`shop_buy_${p.productId}`)
            .setLabel(`Kaufen`)
            .setStyle(ButtonStyle.Success)
    );
    
    const rows = [];
    for (let i = 0; i < buyButtons.length; i += 5) {
        rows.push(new ActionRowBuilder().addComponents(buyButtons.slice(i, i + 5)));
    }
    
    await interaction.followUp({
        embeds: [embed],
        components: rows,
        ephemeral: true
    });
}

/**
 * Ticket Kategorie Select Handler
 */
async function handleTicketCategorySelect(interaction, client) {
    const { Ticket, Guild } = require('./database');
    const selectedCategory = interaction.values[0];
    
    await interaction.deferUpdate();
    
    // Prüfe ob User schon ein offenes Ticket hat
    const existingTicket = await Ticket.findOne({
        userId: interaction.user.id,
        status: 'open'
    });
    
    if (existingTicket) {
        return interaction.followUp({
            embeds: [EmbedFactory.createErrorEmbed('Du hast bereits ein offenes Ticket!')],
            ephemeral: true
        });
    }
    
    // Erstelle neuen Channel
    const ticketNumber = await getNextTicketNumber();
    const channelName = `ticket-${interaction.user.username}-${ticketNumber}`;
    
    const parentCategory = await getTicketCategory(interaction.guild);
    
    const channel = await interaction.guild.channels.create({
        name: channelName,
        topic: `Ticket von ${interaction.user.tag} | ${selectedCategory}`,
        parent: parentCategory,
        permissionOverwrites: [
            {
                id: interaction.guild.roles.everyone,
                deny: ['ViewChannel']
            },
            {
                id: interaction.user.id,
                allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
            },
            {
                id: interaction.guild.roles.cache.find(r => r.name.toLowerCase().includes('staff')) || interaction.guild.roles.everyone,
                allow: ['ViewChannel', 'SendMessages', 'ManageChannels']
            }
        ]
    });
    
    // Speichere Ticket in DB
    const ticket = await Ticket.create({
        ticketId: uuidv4(),
        ticketNumber,
        guildId: interaction.guild.id,
        channelId: channel.id,
        userId: interaction.user.id,
        userName: interaction.user.tag,
        category: selectedCategory,
        status: 'open'
    });
    
    // Sende Welcome Nachricht im Ticket
    const ticketEmbed = EmbedFactory.createTicketCreatedEmbed(ticket, selectedCategory);
    
    const ticketButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('🔒 Schließen')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('ticket_claim')
            .setLabel('📋 Beanspruchen')
            .setStyle(ButtonStyle.Primary)
    );
    
    await channel.send({
        content: `${interaction.user} Willkommen im Support!`,
        embeds: [ticketEmbed],
        components: [ticketButtons]
    });
    
    // Benachrichtige User
    await interaction.followUp({
        content: `Dein Ticket wurde erstellt: ${channel}`,
        ephemeral: true
    });
    
    // Logge Ticket Erstellung
    logger.ticket('Ticket erstellt', {
        ticketId: ticket.ticketId,
        user: interaction.user.id,
        category: selectedCategory
    });
}

/**
 * Help Kategorie Select Handler
 */
async function handleHelpCategorySelect(interaction, client) {
    const selectedCategory = interaction.values[0];
    
    const helpTexts = {
        shop: {
            title: '🛒 Shop Commands',
            description: '`/shop` - Öffne das Shop Menü\n`/buy <item>` - Kaufe ein Produkt\n`/inventory` - Dein Inventar\n`/orders` - Deine Bestellungen\n`/products` - Alle Produkte anzeigen'
        },
        ticket: {
            title: '🎫 Ticket Commands',
            description: '`/ticket` - Erstelle ein Ticket\n`/close` - Schließe dein Ticket\n`/claim` - Beanspruche ein Ticket\n`/reopen` - Öffne Ticket erneut'
        },
        roblox: {
            title: '🎮 Roblox Commands',
            description: '`/link <username>` - Verbinde Roblox Account\n`/roblox <user>` - Zeige Roblox Profil\n`/verify` - Verifizierungsprozess starten'
        },
        moderation: {
            title: '⚔️ Moderation Commands',
            description: '`/ban <user>` - Banne einen User\n`/kick <user>` - Kicke einen User\n`/mute <user>` - Stummschalten\n`/warn <user>` - Verwarnung\n`/purge <amount>` - Nachrichten löschen'
        },
        utility: {
            title: '⭐ Utility Commands',
            description: '`/help` - Hilfe Menü\n`/ping` - Bot Latenz\n`/userinfo <user>` - User Infos\n`/serverinfo` - Server Infos\n`/botinfo` - Bot Statistiken'
        }
    };
    
    const helpData = helpTexts[selectedCategory] || { title: 'Hilfe', description: 'Kategorie nicht gefunden.' };
    
    await interaction.reply({
        embeds: [EmbedFactory.createBaseEmbed({
            color: config.colors.info,
            title: helpData.title,
            description: helpData.description
        })],
        ephemeral: true
    });
}

/**
 * Buy Modal Handler
 */
async function handleBuyModal(interaction, client) {
    const { Product, Order, User } = require('./database');
    
    const productId = client.pendingPurchases?.[interaction.user.id];
    
    if (!productId) {
        return interaction.reply({
            embeds: [EmbedFactory.createErrorEmbed('Ungültiger Kaufvorgang. Bitte starte neu.')],
            ephemeral: true
        });
    }
    
    const product = await Product.findOne({ productId });
    
    if (!product || !product.enabled) {
        return interaction.reply({
            embeds: [EmbedFactory.createErrorEmbed('Produkt nicht verfügbar!')],
            ephemeral: true
        });
    }
    
    const quantity = parseInt(interaction.fields.getTextInputValue('quantity')) || 1;
    const totalPrice = product.price * quantity;
    
    // Prüfe Stock
    if (product.stock !== -1 && product.stock < quantity) {
        return interaction.reply({
            embeds: [EmbedFactory.createErrorEmbed(`Nicht genug Lagerbestand! Verfügbar: ${product.stock}`)],
            ephemeral: true
        });
    }
    
    // Erstelle Bestellung
    const orderId = uuidv4();
    const paymentCode = generatePaymentCode();
    
    const order = await Order.create({
        orderId,
        userId: interaction.user.id,
        userName: interaction.user.tag,
        products: [{
            productId: product.productId,
            name: product.name,
            price: product.price,
            quantity
        }],
        totalAmount: totalPrice,
        paymentCode,
        paymentStatus: 'pending',
        deliveryStatus: 'pending'
    });
    
    // Aktualisiere Pending Purchases
    delete client.pendingPurchases[interaction.user.id];
    
    // Sende Kaufanleitung per DM
    const dmEmbed = EmbedFactory.createOrderEmbed(order, paymentCode);
    
    try {
        await interaction.user.send({ embeds: [dmEmbed] });
    } catch (error) {
        logger.warn('Konnte DM nicht senden:', error.message);
    }
    
    // Antwort im Channel
    await interaction.reply({
        embeds: [EmbedFactory.createSuccessEmbed(
            `Bestellung **#${orderId.substring(0, 8)}** erstellt!\n\n` +
            `Bitte überprüfe deine **Direktnachrichten** für die Zahlungsanleitung.`
        )],
        ephemeral: true
    });
    
    // Logge Bestellung
    logger.shop('Bestellung erstellt', {
        orderId,
        user: interaction.user.id,
        product: product.name,
        amount: totalPrice
    });
    
    client.botStats.ordersProcessed++;
}

/**
 * Report Modal Handler
 */
async function handleReportModal(interaction, client) {
    const reason = interaction.fields.getTextInputValue('report_reason');
    const evidence = interaction.fields.getTextInputValue('report_evidence') || 'Keine angegeben';
    
    // Erstelle Report Ticket
    await interaction.reply({
        embeds: [EmbedFactory.createSuccessEmbed('Report eingereicht! Ein Staff-Mitarbeiter wird sich darum kümmern.')],
        ephemeral: true
    });
    
    // Benachrichtige Staff (hier könnte man einen Webhook nutzen)
    logger.mod('Report eingereicht', {
        user: interaction.user.id,
        reason,
        evidence
    });
}

/**
 * Application Modal Handler
 */
async function handleApplicationModal(interaction, client) {
    const age = interaction.fields.getTextInputValue('app_age');
    const experience = interaction.fields.getTextInputValue('app_experience');
    const motivation = interaction.fields.getTextInputValue('app_motivation');
    
    await interaction.reply({
        embeds: [EmbedFactory.createSuccessEmbed('Bewerbung eingereicht! Das Team wird sich bald melden.')],
        ephemeral: true
    });
    
    logger.info('Bewerbung erhalten', {
        user: interaction.user.id,
        age,
        experience: experience.substring(0, 50) + '...'
    });
}

/**
 * Hilfsfunktionen
 */

async function getNextTicketNumber() {
    const { Ticket } = require('./database');
    const lastTicket = await Ticket.findOne().sort({ ticketNumber: -1 });
    return lastTicket ? lastTicket.ticketNumber + 1 : 1;
}

async function getTicketCategory(guild) {
    // Versuche eine "Tickets" Kategorie zu finden oder erstelle sie
    let category = guild.channels.cache.find(c => c.type === 4 && c.name.toLowerCase().includes('ticket'));
    
    if (!category) {
        category = await guild.channels.create({
            name: '🎫・Tickets',
            type: 4 // GUILD_CATEGORY
        });
    }
    
    return category;
}

async function createTranscript(channel, ticket) {
    // Simuliere Transcript-Erstellung (echte Implementierung würde Nachrichten scrapen)
    return `https://transcripts.xerionx.com/${ticket.ticketId}.html`;
}

function generatePaymentCode(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
