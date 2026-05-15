/**
 * Event: Ready - Wird ausgelöst wenn der Bot bereit ist
 */

const { ActivityType } = require('discord.js');
const config = require('./config');
const logger = require('./logger');

module.exports = {
    name: 'ready',
    once: true,
    
    async execute(client) {
        logger.info('━━━━━━━━━━━━━━━━━━');
        logger.info(`✅ ${config.botName} ist online!`);
        logger.info('━━━━━━━━━━━━━━━━━━');
        logger.info(`Bot ID: ${client.user.id}`);
        logger.info(`Bot Tag: ${client.user.tag}`);
        logger.info(`Server: ${client.guilds.cache.size}`);
        logger.info(`Commands: ${client.commands.size}`);
        logger.info('━━━━━━━━━━━━━━━━━━');
        
        // Setze Rich Presence
        updatePresence(client);
        
        // Aktualisiere Präsenz alle 10 Minuten
        setInterval(() => updatePresence(client), 600000);
        
        // Logge Startup zur Datenbank
        try {
            const { Log } = require('./database');
            await Log.create({
                logId: `startup-${Date.now()}`,
                guildId: 'global',
                type: 'verification',
                action: 'bot_startup',
                data: {
                    version: '1.0.0',
                    guilds: client.guilds.cache.size,
                    commands: client.commands.size
                }
            });
        } catch (error) {
            logger.debug('Startup Log nicht erstellt:', error.message);
        }
    }
};

/**
 * Aktualisiert die Bot-Präsenz mit rotierenden Status
 */
function updatePresence(client) {
    const activities = [
        { name: `${config.shopName} | /help`, type: ActivityType.Watching },
        { name: '/shop für Premium Items', type: ActivityType.Playing },
        { name: 'Roblox Community', type: ActivityType.Watching },
        { name: 'Tickets erstellen | /ticket', type: ActivityType.Competing },
        { name: `${client.guilds.cache.size} Server`, type: ActivityType.Watching }
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    
    client.user.setPresence({
        activities: [randomActivity],
        status: 'online'
    });
}
