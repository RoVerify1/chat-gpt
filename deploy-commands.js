/**
 * Deploy Commands Script - Registriert Slash Commands bei Discord
 * usage: node deploy-commands.js
 */

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

async function deployCommands() {
    // Suche alle Command-Dateien im aktuellen Verzeichnis
    const commandFiles = fs.readdirSync(process.cwd()).filter(file => 
        file.startsWith('cmd-') && file.endsWith('.js')
    );
    
    const commands = [];
    
    // Lade alle Commands und sammle ihre Daten
    for (const file of commandFiles) {
        try {
            const command = require(path.join(process.cwd(), file));
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
                logger.info(`Command gefunden: ${command.data.name}`);
            }
        } catch (error) {
            logger.error(`Fehler beim Laden von ${file}:`, error);
        }
    }
    
    if (commands.length === 0) {
        logger.warn('Keine Commands gefunden!');
        return;
    }
    
    // Erstelle REST Instanz mit dem Bot Token
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        logger.info(`🔄 Starte Registrierung von ${commands.length} Slash Commands...`);
        
        // Registriere Commands global ODER für einen spezifischen Server
        let data;
        
        if (process.env.DISCORD_GUILD_ID) {
            // Guild-specific (schneller für Testing)
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
                { body: commands }
            );
            logger.info(`✅ ${data.length} Commands erfolgreich im Guild registriert!`);
        } else {
            // Global (kann bis zu 1 Stunde dauern)
            data = await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands }
            );
            logger.info(`✅ ${data.length} Commands erfolgreich global registriert!`);
        }
        
        logger.info('━━━━━━━━━━━━━━━━━━');
        logger.info('Registrierte Commands:');
        commands.forEach(cmd => {
            logger.info(`  • /${cmd.name} - ${cmd.description}`);
        });
        logger.info('━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        logger.error('❌ Fehler beim Registrieren:', error);
        
        if (error.code === 50001) {
            logger.error('Tipp: Stelle sicher, dass die Client ID korrekt ist und der Bot auf dem Server ist.');
        }
        
        process.exit(1);
    }
}

// Führe Deployment aus
deployCommands();
