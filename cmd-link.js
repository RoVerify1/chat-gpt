/**
 * Command: Link - Verknüpft Discord mit Roblox Account
 * /link <roblox_username>
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config');
const EmbedFactory = require('./embeds');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('🎮 Verknüpfe deinen Roblox Account')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Dein Roblox Benutzername')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const robloxUsername = interaction.options.getString('username');
        const { User } = require('./database');
        
        try {
            // Prüfe ob User bereits verifiziert ist
            let userData = await User.findOne({ userId: interaction.user.id });
            
            if (userData && userData.isVerified) {
                return interaction.editReply({
                    embeds: [EmbedFactory.createWarningEmbed(
                        `Du bist bereits als \`${userData.robloxUsername}\` verifiziert.\n\n` +
                        `Wenn du einen anderen Account verknüpfen möchtest, kontaktiere bitte den Support.`
                    )]
                });
            }
            
            // Generiere Verifizierungscode
            const verificationCode = generateVerificationCode(config.security.verificationCodeLength);
            
            // Erstelle oder aktualisiere User Eintrag
            if (!userData) {
                userData = await User.create({
                    userId: interaction.user.id,
                    guildId: interaction.guild.id,
                    robloxUsername,
                    verificationCode,
                    isVerified: false
                });
            } else {
                userData.robloxUsername = robloxUsername;
                userData.verificationCode = verificationCode;
                userData.isVerified = false;
                await userData.save();
            }
            
            // Sende Verifizierungsanleitung
            const verifyEmbed = EmbedFactory.createVerificationEmbed(verificationCode);
            
            const verifyButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_check')
                    .setLabel('✅ Ich habe den Code gesetzt')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setLabel('🔗 Roblox Profil')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://www.roblox.com/users/profile`)
            );
            
            await interaction.editReply({
                embeds: [verifyEmbed],
                components: [verifyButtons]
            });
            
            logger.roblox('Verifizierung gestartet', {
                user: interaction.user.id,
                username: robloxUsername,
                code: verificationCode.substring(0, 4) + '...'
            });
            
        } catch (error) {
            logger.error('Fehler bei Roblox Link:', error);
            await interaction.editReply({
                embeds: [EmbedFactory.createErrorEmbed(
                    'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
                )]
            });
        }
    }
};

/**
 * Generiert einen einzigartigen Verifizierungscode
 */
function generateVerificationCode(length = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Keine ähnlichen Zeichen wie I,1,O,0
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
