/**
 * Winston Logger für XerionX Bot
 * Professionelles Logging-System mit Console und File Output
 */

const winston = require('winston');
const path = require('path');

// Definiere benutzerdefinierte Farben für Console
const customColors = {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'green',
    shop: 'magenta',
    ticket: 'blue',
    roblox: 'orange',
    mod: 'redBright'
};

winston.addColors(customColors);

// Erstelle Logger mit Console und File Transport
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${metaString}`;
        })
    ),
    transports: [
        // Console Transport mit Farben
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.timestamp({ format: 'HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
                    return `${timestamp} [${level}]: ${message} ${metaString}`;
                })
            )
        }),
        
        // Error Log File
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'error.log'),
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        
        // Combined Log File
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'combined.log'),
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        
        // Shop Log File
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'shop.log'),
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        
        // Ticket Log File
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'tickets.log'),
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
});

// Erstelle Logs Verzeichnis wenn nicht vorhanden
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom Log Methods für spezifische Bereiche
const customLogger = {
    /**
     * Standard Info Log
     */
    info(message, meta) {
        logger.info(message, meta);
    },

    /**
     * Error Log mit Stack Trace
     */
    error(message, meta) {
        logger.error(message, meta);
    },

    /**
     * Warning Log
     */
    warn(message, meta) {
        logger.warn(message, meta);
    },

    /**
     * Debug Log
     */
    debug(message, meta) {
        logger.debug(message, meta);
    },

    /**
     * Shop-spezifischer Log
     */
    shop(message, data) {
        logger.log('shop', `[SHOP] ${message}`, data);
    },

    /**
     * Ticket-spezifischer Log
     */
    ticket(message, data) {
        logger.log('ticket', `[TICKET] ${message}`, data);
    },

    /**
     * Roblox-spezifischer Log
     */
    roblox(message, data) {
        logger.log('roblox', `[ROBLOX] ${message}`, data);
    },

    /**
     * Moderation-spezifischer Log
     */
    mod(message, data) {
        logger.log('mod', `[MOD] ${message}`, data);
    },

    /**
     * Command Log
     */
    command(commandName, userId, guildId) {
        this.info(`Command ausgeführt`, { 
            command: commandName, 
            user: userId, 
            guild: guildId 
        });
    },

    /**
     * Error Handler Helper
     */
    handleError(error, context = 'Unknown') {
        this.error(`Fehler in ${context}`, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
};

module.exports = customLogger;
