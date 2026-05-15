/**
 * Command: Ping - Zeigt die Bot Latenz
 * /ping
 */

const { SlashCommandBuilder } = require('discord.js');
const config = require('./config');
const EmbedFactory = require('./embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Zeigt die Bot Latenz'),
    
    async execute(interaction) {
        // Sende erste Antwort um Response Time zu messen
        const sent = await interaction.reply({
            content: '🏓 Messe Ping...',
            fetchReply: true
        });
        
        // Berechne Latenzen
        const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        
        // Bestimme Status basierend auf Latenz
        let status, color;
        if (apiLatency < 100) {
            status = '🟢 Exzellent';
            color = config.colors.success;
        } else if (apiLatency < 200) {
            status = '🟡 Gut';
            color = config.colors.warning;
        } else if (apiLatency < 500) {
            status = '🟠 Okay';
            color = config.colors.warning;
        } else {
            status = '🔴 Hoch';
            color = config.colors.error;
        }
        
        const pingEmbed = EmbedFactory.createBaseEmbed({
            color,
            title: '🏓 Pong!',
            description: `Hier sind die aktuellen Latenz-Werte:`
        })
        .addFields([
            { 
                name: '🤖 Bot Latenz', 
                value: `**${botLatency}ms**`, 
                inline: true 
            },
            { 
                name: '🌐 API Latenz', 
                value: `**${apiLatency}ms**`, 
                inline: true 
            },
            { 
                name: '📊 Status', 
                value: status, 
                inline: true 
            },
            { 
                name: '💻 Uptime', 
                value: formatUptime(process.uptime()), 
                inline: false 
            }
        ])
        .setFooter({ text: `Bot Version 1.0.0 • ${config.botName}` });
        
        await interaction.editReply({
            content: null,
            embeds: [pingEmbed]
        });
    }
};

/**
 * Formatiert Uptime in lesbare Zeit
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    
    return parts.join(' ');
}
