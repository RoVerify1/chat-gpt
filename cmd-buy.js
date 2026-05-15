/**
 * Command: Buy - Kauft ein Produkt aus dem Shop
 * /buy item <product_id>
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('./config');
const EmbedFactory = require('./embeds');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('🛒 Kaufe ein Produkt')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('Produkt-ID (z.B. 00343)')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption(option =>
            option.setName('menge')
                .setDescription('Anzahl (Standard: 1)')
                .setMinValue(1)
                .setMaxValue(100)
        ),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const productId = interaction.options.getString('item');
        const quantity = interaction.options.getInteger('menge') || 1;
        
        const { Product, Order, User, Blacklist } = require('./database');
        
        try {
            // Prüfe ob User gebannt ist
            const blacklisted = await Blacklist.findOne({ 
                userId: interaction.user.id,
                guildId: interaction.guild.id 
            });
            
            if (blacklisted) {
                return interaction.editReply({
                    embeds: [EmbedFactory.createErrorEmbed(
                        `Du bist vom Shop gebannt.\n**Grund:** ${blacklisted.reason}`
                    )]
                });
            }
            
            // Suche Produkt
            const product = await Product.findOne({ 
                productId: { $regex: new RegExp(`^${productId}$`, 'i') },
                enabled: true
            });
            
            if (!product) {
                return interaction.editReply({
                    embeds: [EmbedFactory.createErrorEmbed(
                        `Produkt mit der ID \`${productId}\` wurde nicht gefunden.`
                    )]
                });
            }
            
            // Prüfe Lagerbestand
            if (product.stock === 0) {
                return interaction.editReply({
                    embeds: [EmbedFactory.createErrorEmbed('Dieses Produkt ist ausverkauft!')]
                });
            }
            
            if (product.stock !== -1 && product.stock < quantity) {
                return interaction.editReply({
                    embeds: [EmbedFactory.createErrorEmbed(
                        `Nicht genug Lagerbestand! Verfügbar: ${product.stock}`
                    )]
                });
            }
            
            // Berechne Gesamtpreis mit Rabatt
            const basePrice = product.price * quantity;
            const discountAmount = product.discount > 0 ? Math.round(basePrice * (product.discount / 100)) : 0;
            const totalPrice = basePrice - discountAmount;
            
            // Erstelle Bestellung
            const orderId = uuidv4();
            const paymentCode = generatePaymentCode(12);
            
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
            
            // Aktualisiere Produkt-Statistiken
            product.sales += quantity;
            if (product.stock !== -1) {
                product.stock -= quantity;
            }
            await product.save();
            
            // Sende Kaufbestätigung per DM
            const dmEmbed = EmbedFactory.createOrderEmbed(order, paymentCode);
            
            try {
                await interaction.user.send({ embeds: [dmEmbed] });
            } catch (error) {
                logger.warn('Konnte DM nicht senden:', error.message);
            }
            
            // Antwort im Channel
            const successEmbed = EmbedFactory.createBaseEmbed({
                color: config.colors.success,
                title: `${config.emojis.gift} Bestellung erfolgreich!`,
                description: `Deine Bestellung **#${orderId.substring(0, 8)}** wurde erstellt!\n\n` +
                    `**Produkt:** ${product.name}\n` +
                    `**Menge:** ${quantity}x\n` +
                    `**Gesamtpreis:** ${totalPrice} ${product.currency}\n\n` +
                    `${config.emojis.inbox} Bitte überprüfe deine **Direktnachrichten** für die Zahlungsanleitung.`
            })
            .addFields([
                { name: 'Bestellnummer', value: `\`${orderId.substring(0, 8)}...\``, inline: true },
                { name: 'Payment Code', value: `\`${paymentCode.substring(0, 6)}...\``, inline: true },
                { name: 'Status', value: '**Ausstehend**', inline: true }
            ]);
            
            await interaction.editReply({ embeds: [successEmbed] });
            
            // Logge Bestellung
            logger.shop('Bestellung erstellt', {
                orderId,
                user: interaction.user.id,
                userTag: interaction.user.tag,
                product: product.name,
                productId: product.productId,
                quantity,
                totalPrice,
                currency: product.currency
            });
            
            interaction.client.botStats.ordersProcessed++;
            
        } catch (error) {
            logger.error('Fehler beim Kauf:', error);
            await interaction.editReply({
                embeds: [EmbedFactory.createErrorEmbed(
                    'Ein Fehler ist aufgetreten. Bitte versuche es erneut oder kontaktiere den Support.'
                )]
            });
        }
    },
    
    /**
     * Autocomplete Handler für Produkt-Suche
     */
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const { Product } = require('./database');
        
        try {
            const products = await Product.find({
                enabled: true,
                $or: [
                    { name: { $regex: focusedValue, $options: 'i' } },
                    { productId: { $regex: focusedValue, $options: 'i' } }
                ]
            }).limit(25);
            
            const choices = products.map(product => ({
                name: `${product.name} | ${product.price} ${product.currency}`,
                value: product.productId
            }));
            
            await interaction.respond(choices);
        } catch (error) {
            await interaction.respond([]);
        }
    }
};

/**
 * Generiert einen einzigartigen Payment Code
 */
function generatePaymentCode(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
