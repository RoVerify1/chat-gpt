/**
 * XerionX Bot - Hauptdatei (index.js)
 * Startet den Discord Bot, verbindet mit MongoDB und initialisiert alle Systeme
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const config = require('./config');
const logger = require('./logger');

// Erstelle Discord Client mit allen benötigten Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
    ],
    presence: {
        activities: [{ 
            name: `${config.shopName} | /help`, 
            type: ActivityType.Watching 
        }],
        status: 'online'
    }
});

// Command Collection für Slash Commands
client.commands = new Collection();

// Globale Variablen für Bot-Status
client.botStats = {
    startTime: Date.now(),
    commandsExecuted: 0,
    ticketsCreated: 0,
    ordersProcessed: 0
};

/**
 * Verbindet mit MongoDB Datenbank
 */
async function connectDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('✅ Erfolgreich mit MongoDB verbunden');
    } catch (error) {
        logger.error('❌ MongoDB Verbindungsfehler:', error);
        process.exit(1);
    }
}

/**
 * Lädt alle Commands dynamisch
 */
async function loadCommands() {
    const fs = require('fs');
    const path = require('path');
    
    // Suche nach Command-Dateien im aktuellen Verzeichnis
    const commandFiles = fs.readdirSync(process.cwd()).filter(file => 
        file.startsWith('cmd-') && file.endsWith('.js')
    );
    
    for (const file of commandFiles) {
        try {
            const command = require(path.join(process.cwd(), file));
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                logger.info(`Command geladen: ${command.data.name}`);
            } else {
                logger.warn(`Ungültiges Command Format: ${file}`);
            }
        } catch (error) {
            logger.error(`Fehler beim Laden von ${file}:`, error);
        }
    }
    
    logger.info(`Insgesamt ${client.commands.size} Commands geladen`);
}

/**
 * Lädt alle Event-Handler
 */
async function loadEvents() {
    const fs = require('fs');
    const path = require('path');
    
    const eventFiles = fs.readdirSync(process.cwd()).filter(file => 
        file.startsWith('evt-') && file.endsWith('.js')
    );
    
    for (const file of eventFiles) {
        try {
            const event = require(path.join(process.cwd(), file));
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            logger.info(`Event geladen: ${event.name}`);
        } catch (error) {
            logger.error(`Fehler beim Laden von ${file}:`, error);
        }
    }
    
    logger.info(`Insgesamt ${eventFiles.length} Events geladen`);
}

/**
 * Startet Express API Server für externe Anfragen
 */
function startAPIServer() {
    const app = express();
    app.use(express.json());
    
    // Health Check Endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            uptime: process.uptime(),
            botOnline: client.isReady(),
            guilds: client.guilds.cache.size,
            timestamp: new Date().toISOString()
        });
    });
    
    // Bot Stats Endpoint
    app.get('/api/stats', (req, res) => {
        res.json({
            guilds: client.guilds.cache.size,
            users: client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0),
            commands: client.commands.size,
            uptime: Math.floor((Date.now() - client.botStats.startTime) / 1000),
            commandsExecuted: client.botStats.commandsExecuted
        });
    });
    
    // Shop API Endpoint (Beispiel)
    app.get('/api/shop/products', async (req, res) => {
        try {
            const { Product } = require('./database');
            const products = await Product.find({ enabled: true }).limit(50);
            res.json({ success: true, count: products.length, products });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
    
    const PORT = config.api.port;
    app.listen(PORT, () => {
        logger.info(`Express API Server läuft auf Port ${PORT}`);
    });
}

/**
 * Error Handler für uncaught exceptions
 */
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', { reason, promise });
});

/**
 * Graceful Shutdown bei SIGINT/SIGTERM
 */
async function gracefulShutdown(signal) {
    logger.info(`${signal} erhalten. Schließe Bot ordnungsgemäß...`);
    
    try {
        await mongoose.connection.close();
        logger.info('MongoDB Verbindung geschlossen');
        
        client.destroy();
        logger.info('Discord Client zerstört');
        
        process.exit(0);
    } catch (error) {
        logger.error('Fehler beim Shutdown:', error);
        process.exit(1);
    }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

/**
 * Haupt-Initialisierung
 */
async function initializeBot() {
    logger.info('🚀 Starte XerionX Bot...');
    logger.info(`Bot Name: ${config.botName}`);
    logger.info(`Shop Name: ${config.shopName}`);
    
    // Verbinde mit Datenbank
    await connectDatabase();
    
    // Lade Commands und Events
    await loadCommands();
    await loadEvents();
    
    // Starte API Server
    startAPIServer();
    
    // Logge den Bot ein
    try {
        await client.login(process.env.DISCORD_TOKEN);
        logger.info('✅ Bot erfolgreich eingeloggt!');
    } catch (error) {
        logger.error('❌ Login fehlgeschlagen:', error);
        process.exit(1);
    }
}

// Starte den Bot
initializeBot().catch(error => {
    logger.error('Fataler Fehler beim Start:', error);
    process.exit(1);
});

module.exports = client;
