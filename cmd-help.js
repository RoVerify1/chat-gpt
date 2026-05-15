/**
 * Command: Help - Zeigt das Hilfe Menü
 * /help [category]
 */

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('./config');
const EmbedFactory = require('./embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('ℹ️ Zeigt das Hilfe Menü')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Wähle eine Kategorie für spezifische Hilfe')
                .setRequired(false)
                .addChoices(
                    { name: '🛒 Shop', value: 'shop' },
                    { name: '🎫 Ticket', value: 'ticket' },
                    { name: '🎮 Roblox', value: 'roblox' },
                    { name: '⚔️ Moderation', value: 'moderation' },
                    { name: '⭐ Utility', value: 'utility' }
                )
        ),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const category = interaction.options.getString('category');
        
        if (category) {
            await showCategoryHelp(interaction, category);
        } else {
            await showMainHelp(interaction);
        }
    }
};

/**
 * Zeigt das Haupt-Hilfe Menü mit Select Menu
 */
async function showMainHelp(interaction) {
    const helpEmbed = EmbedFactory.createHelpEmbed();
    
    // Erstelle Select Menu für Kategorien
    const categorySelect = new StringSelectMenuBuilder()
        .setCustomId('help_category')
        .setPlaceholder('Wähle eine Kategorie...')
        .addOptions([
            { label: 'Shop Commands', value: 'shop', emoji: '🛒', description: 'Alle Shop-Befehle' },
            { label: 'Ticket Commands', value: 'ticket', emoji: '🎫', description: 'Ticket System' },
            { label: 'Roblox Commands', value: 'roblox', emoji: '🎮', description: 'Roblox Integration' },
            { label: 'Moderation', value: 'moderation', emoji: '⚔️', description: 'Moderations-Befehle' },
            { label: 'Utility', value: 'utility', emoji: '⭐', description: 'Nützliche Befehle' }
        ]);
    
    const selectRow = new ActionRowBuilder().addComponents(categorySelect);
    
    // Bot Stats
    const uptime = Math.floor((Date.now() - interaction.client.botStats.startTime) / 1000);
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    helpEmbed.addFields({
        name: '📊 Bot Statistiken',
        value: `• Server: **${interaction.client.guilds.cache.size}**\n` +
               `• Commands: **${interaction.client.commands.size}**\n` +
               `• Uptime: **${days}d ${hours}h ${minutes}m**\n` +
               `• Version: **1.0.0**`,
        inline: false
    });
    
    await interaction.editReply({
        embeds: [helpEmbed],
        components: [selectRow]
    });
}

/**
 * Zeigt Hilfe für eine spezifische Kategorie
 */
async function showCategoryHelp(interaction, category) {
    const helpTexts = {
        shop: {
            title: '🛒 Shop Commands',
            color: config.colors.premium,
            description: 'Alle Commands für den XerionX Shop',
            commands: [
                { name: '/shop open', desc: 'Öffnet das Shop Hauptmenü' },
                { name: '/shop search <query>', desc: 'Sucht nach Produkten' },
                { name: '/buy <item> [menge]', desc: 'Kauft ein Produkt' },
                { name: '/inventory', desc: 'Zeigt dein Inventar' },
                { name: '/orders', desc: 'Zeigt deine Bestellungen' },
                { name: '/products [category]', desc: 'Zeigt alle Produkte' }
            ]
        },
        ticket: {
            title: '🎫 Ticket Commands',
            color: config.colors.info,
            description: 'Commands für das Support Ticket System',
            commands: [
                { name: '/ticket create', desc: 'Erstellt ein neues Ticket' },
                { name: '/ticket close', desc: 'Schließt dein Ticket' },
                { name: '/ticket claim', desc: 'Beansprucht ein Ticket (Staff)' },
                { name: '/reopen', desc: 'Öffnet ein geschlossenes Ticket' }
            ]
        },
        roblox: {
            title: '🎮 Roblox Commands',
            color: config.colors.roblox,
            description: 'Commands für Roblox Integration',
            commands: [
                { name: '/link <username>', desc: 'Verknüpft Roblox Account' },
                { name: '/roblox <user>', desc: 'Zeigt Roblox Profil' },
                { name: '/verify', desc: 'Startet Verifizierung' },
                { name: '/rankcheck', desc: 'Überprüft Gruppen Rang' }
            ]
        },
        moderation: {
            title: '⚔️ Moderation Commands',
            color: config.colors.error,
            description: 'Commands für Server Moderation',
            commands: [
                { name: '/ban <user> [grund]', desc: 'Bannt einen User' },
                { name: '/kick <user> [grund]', desc: 'Kickt einen User' },
                { name: '/mute <user> [dauer]', desc: 'Stummschaltet einen User' },
                { name: '/unmute <user>', desc: 'Entfernt Stummschaltung' },
                { name: '/warn <user> <grund>', desc: 'Verwarnt einen User' },
                { name: '/warnings <user>', desc: 'Zeigt Warnungen' },
                { name: '/purge <amount>', desc: 'Löscht Nachrichten' },
                { name: '/slowmode <seconds>', desc: 'Setzt Slowmode' },
                { name: '/lock [channel]', desc: 'Sperrt einen Channel' },
                { name: '/unlock [channel]', desc: 'Entsperrt einen Channel' }
            ]
        },
        utility: {
            title: '⭐ Utility Commands',
            color: config.colors.success,
            description: 'Nützliche Commands für alle',
            commands: [
                { name: '/help', desc: 'Zeigt dieses Menü' },
                { name: '/ping', desc: 'Zeigt die Bot Latenz' },
                { name: '/userinfo <user>', desc: 'Zeigt User Infos' },
                { name: '/serverinfo', desc: 'Zeigt Server Infos' },
                { name: '/avatar <user>', desc: 'Zeigt Avatar' },
                { name: '/botinfo', desc: 'Zeigt Bot Informationen' }
            ]
        }
    };
    
    const helpData = helpTexts[category];
    
    if (!helpData) {
        return interaction.editReply({
            embeds: [EmbedFactory.createErrorEmbed('Kategorie nicht gefunden!')]
        });
    }
    
    const embed = EmbedFactory.createBaseEmbed({
        color: helpData.color,
        title: helpData.title,
        description: helpData.description
    });
    
    // Füge Commands als Fields hinzu
    for (const cmd of helpData.commands) {
        embed.addFields({
            name: `\`${cmd.name}\``,
            value: cmd.desc,
            inline: false
        });
    }
    
    await interaction.editReply({ embeds: [embed] });
}
