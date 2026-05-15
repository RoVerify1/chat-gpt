/**
 * Event: Guild Member Add - Welcome System für neue Mitglieder
 */

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');
const EmbedFactory = require('./embeds');
const logger = require('./logger');

module.exports = {
    name: 'guildMemberAdd',
    
    async execute(member, client) {
        const guild = member.guild;
        
        try {
            // Hole Guild Einstellungen aus DB
            const { Guild: GuildModel } = require('./database');
            let guildData = await GuildModel.findOne({ guildId: guild.id });
            
            // Erstelle Guild Eintrag wenn nicht vorhanden
            if (!guildData) {
                guildData = await GuildModel.create({
                    guildId: guild.id,
                    guildName: guild.name
                });
            }
            
            // Sende Welcome Embed im Welcome Channel
            const welcomeChannel = getWelcomeChannel(guild, guildData);
            
            if (welcomeChannel) {
                const welcomeEmbed = EmbedFactory.createWelcomeEmbed(member, guild);
                
                const welcomeButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('shop_open')
                        .setLabel(`${config.emojis.shop} Shop`)
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('ticket_open')
                        .setLabel(`${config.emojis.ticket} Support`)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('verify_roblox')
                        .setLabel(`${config.emojis.roblox} Verifizieren`)
                        .setStyle(ButtonStyle.Secondary)
                );
                
                await welcomeChannel.send({
                    content: `Willkommen ${member}! 👋`,
                    embeds: [welcomeEmbed],
                    components: [welcomeButtons]
                }).catch(err => logger.warn('Konnte Welcome nicht senden:', err.message));
            }
            
            // Weise Auto Role zu
            if (guildData.autoRole) {
                const autoRole = guild.roles.cache.get(guildData.autoRole);
                if (autoRole && guild.members.me.permissions.has('ManageRoles')) {
                    await member.roles.add(autoRole).catch(err => 
                        logger.warn('Auto Role fehlgeschlagen:', err.message)
                    );
                }
            }
            
            // Sende DM Welcome Nachricht
            if (guildData.welcomeDM !== false) {
                try {
                    const dmEmbed = EmbedFactory.createBaseEmbed({
                        color: config.colors.success,
                        title: `${config.emojis.hand} Willkommen bei ${guild.name}!`,
                        description: `Hey ${member.user.username},\n\n` +
                            `schön dich bei uns zu haben! Wir freuen uns auf tolle Zeiten zusammen.\n\n` +
                            `**Nützliche Links:**\n` +
                            `${config.emojis.shop} Besuche unseren Shop mit \`/shop\`\n` +
                            `${config.emojis.ticket} Brauchst du Hilfe? Öffne ein Ticket\n` +
                            `${config.emojis.roblox} Verifiziere deinen Roblox Account\n\n` +
                            `Viel Spaß auf dem Server! 🎉`
                    });
                    
                    await member.user.send({ embeds: [dmEmbed] });
                } catch (error) {
                    logger.debug('DM an neuen User fehlgeschlagen (Privacy Settings):', error.message);
                }
            }
            
            // Logge Join Event
            const logChannel = getLogChannel(guild, guildData, 'joins');
            if (logChannel) {
                const leaveEmbed = EmbedFactory.createBaseEmbed({
                    color: config.colors.info,
                    title: `${config.emojis.inbox} Mitglied beigetreten`,
                    thumbnail: member.user.displayAvatarURL({ size: 256, extension: 'png' })
                })
                .addFields([
                    { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: false },
                    { name: 'Account erstellt', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Mitglied Nr.', value: `**${guild.memberCount}**`, inline: true },
                    { name: 'Bot?', value: member.user.bot ? 'Ja' : 'Nein', inline: true }
                ]);
                
                await logChannel.send({ embeds: [leaveEmbed] }).catch(() => {});
            }
            
            logger.info(`Neues Mitglied: ${member.user.tag} auf ${guild.name}`);
            
        } catch (error) {
            logger.error('Fehler im Welcome System:', error);
        }
    }
};

/**
 * Ermittelt den Welcome Channel
 */
function getWelcomeChannel(guild, guildData) {
    // Priorität: 1. Gespeicherter Channel, 2. General Channel
    if (guildData.welcomeChannel) {
        const channel = guild.channels.cache.get(guildData.welcomeChannel);
        if (channel) return channel;
    }
    
    // Suche nach einem "welcome" oder "general" Channel
    const welcomeChannel = guild.channels.cache.find(c => 
        c.type === 0 && // GUILD_TEXT
        (c.name.includes('welcome') || c.name.includes('willkommen') || c.name.includes('general'))
    );
    
    return welcomeChannel;
}

/**
 * Ermittelt den Log Channel
 */
function getLogChannel(guild, guildData, type) {
    const logChannelName = config.logChannels[type] || 'logs';
    
    if (guildData.logChannel) {
        const channel = guild.channels.cache.get(guildData.logChannel);
        if (channel) return channel;
    }
    
    const logChannel = guild.channels.cache.find(c => 
        c.type === 0 && c.name.includes(logChannelName)
    );
    
    return logChannel;
}
