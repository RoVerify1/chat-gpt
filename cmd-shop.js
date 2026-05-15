/**
 * Command: Shop - Öffnet das Premium Shop Menü
 * /shop
 */

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');
const EmbedFactory = require('./embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('🛒 Öffne den XerionX Shop')
        .addSubcommand(subcommand =>
            subcommand
                .setName('open')
                .setDescription('Öffne das Hauptmenü des Shops')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Suche nach einem Produkt')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Suchbegriff')
                        .setRequired(true)
                )
        ),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'open') {
            await handleShopOpen(interaction);
        } else if (subcommand === 'search') {
            await handleShopSearch(interaction);
        }
    }
};

/**
 * Handler für /shop open
 */
async function handleShopOpen(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const shopEmbed = EmbedFactory.createShopEmbed();
    
    // Erstelle Select Menu für Kategorien
    const categorySelect = new StringSelectMenuBuilder()
        .setCustomId('shop_category')
        .setPlaceholder('Wähle eine Kategorie...')
        .addOptions(config.shopCategories.map(cat => ({
            label: cat.name.replace(/^[^\s]+ /, ''), // Entferne Emoji aus Label
            value: cat.id,
            emoji: cat.icon,
            description: cat.id === 'vip' ? 'Exklusive Produkte' : 'Digitale Produkte'
        })));
    
    const selectRow = new ActionRowBuilder().addComponents(categorySelect);
    
    // Buttons für Aktionen
    const actionButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('shop_refresh')
            .setLabel('🔄 Aktualisieren')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('shop_inventory')
            .setLabel('📦 Mein Inventar')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('shop_orders')
            .setLabel('📋 Meine Bestellungen')
            .setStyle(ButtonStyle.Primary)
    );
    
    await interaction.editReply({
        embeds: [shopEmbed],
        components: [selectRow, actionButtons]
    });
}

/**
 * Handler für /shop search
 */
async function handleShopSearch(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const query = interaction.options.getString('query').toLowerCase();
    const { Product } = require('./database');
    
    try {
        // Suche nach Produkten im Namen oder Beschreibung
        const products = await Product.find({
            enabled: true,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        }).limit(10);
        
        if (products.length === 0) {
            return interaction.editReply({
                embeds: [EmbedFactory.createErrorEmbed(`Keine Produkte für "${query}" gefunden.`)]
            });
        }
        
        const embed = EmbedFactory.createBaseEmbed({
            color: config.colors.premium,
            title: `${config.emojis.shop} Suchergebnisse für "${query}"`,
            description: `${products.length} Produkt(e) gefunden:`
        });
        
        products.forEach((product, index) => {
            const price = product.discount > 0 
                ? `~~${product.price}~~ **${Math.round(product.price * (1 - product.discount / 100))}**`
                : `**${product.price}**`;
            
            embed.addFields({
                name: `${index + 1}. ${product.name}`,
                value: `${price} ${product.currency} | Lager: ${product.stock === -1 ? '∞' : product.stock}`,
                inline: false
            });
        });
        
        const buyButtons = products.slice(0, 5).map(p =>
            new ButtonBuilder()
                .setCustomId(`shop_buy_${p.productId}`)
                .setLabel(`Kaufen`)
                .setStyle(ButtonStyle.Success)
        );
        
        const rows = [];
        if (buyButtons.length > 0) {
            rows.push(new ActionRowBuilder().addComponents(buyButtons));
        }
        
        await interaction.editReply({
            embeds: [embed],
            components: rows
        });
        
    } catch (error) {
        logger.error('Fehler bei Shop-Suche:', error);
        await interaction.editReply({
            embeds: [EmbedFactory.createErrorEmbed('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')]
        });
    }
}
