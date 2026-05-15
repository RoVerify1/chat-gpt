/**
 * XerionX Bot - Hauptkonfiguration
 * Alle zentralen Einstellungen des Bots
 */

module.exports = {
    // Bot Identität
    botName: process.env.BOT_NAME || 'XerionX',
    shopName: process.env.SHOP_NAME || 'XerionX Shop',
    prefix: process.env.PREFIX || '/',
    
    // Farben (Hex)
    colors: {
        primary: '#0066FF',      // Hauptfarbe Blau
        success: '#00FF88',      // Grün für Erfolg
        warning: '#FFAA00',      // Orange für Warnungen
        error: '#FF3366',        // Rot für Fehler
        info: '#00CCFF',         // Hellblau für Infos
        roblox: '#FF6B35',       // Roblox Orange
        premium: '#9D4EDD'       // Premium Lila
    },
    
    // Emojis für UI
    emojis: {
        check: '✅',
        cross: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        shop: '🛒',
        ticket: '🎫',
        roblox: '🎮',
        crown: '👑',
        star: '⭐',
        gift: '🎁',
        money: '💰',
        shield: '🛡️',
        sword: '⚔️',
        heart: '❤️',
        fire: '🔥',
        rocket: '🚀',
        gem: '💎'
    },
    
    // Ticket Kategorien
    ticketCategories: [
        { id: 'support', name: '🛟 Support', description: 'Allgemeine Hilfe & Fragen' },
        { id: 'roblox', name: '🎮 Roblox Hilfe', description: 'Roblox-spezifische Probleme' },
        { id: 'reports', name: '📋 Reports', description: 'Spieler melden' },
        { id: 'application', name: '📝 Bewerbungen', description: 'Für Team-Bewerbungen' },
        { id: 'partnership', name: '🤝 Partnership', description: 'Kooperationen' },
        { id: 'shop', name: '🛒 Shop Support', description: 'Bestellungen & Käufe' }
    ],
    
    // Shop Kategorien
    shopCategories: [
        { id: 'gamepass', name: '🎮 Gamepasses', icon: '🎮' },
        { id: 'items', name: '📦 Roblox Items', icon: '📦' },
        { id: 'scripts', name: '💻 Scripts', icon: '💻' },
        { id: 'accounts', name: '👤 Accounts', icon: '👤' },
        { id: 'currency', name: '💰 Ingame Geld', icon: '💰' },
        { id: 'roles', name: '👑 Rollen', icon: '👑' },
        { id: 'vip', name: '💎 VIP Produkte', icon: '💎' }
    ],
    
    // Level System
    levels: {
        xpPerMessage: 10,
        cooldownMs: parseInt(process.env.XP_COOLDOWN_MS) || 60000,
        roleRewards: [
            { level: 5, roleId: null, name: 'Novize' },
            { level: 10, roleId: null, name: 'Aktiv' },
            { level: 25, roleId: null, name: 'Veteran' },
            { level: 50, roleId: null, name: 'Elite' },
            { level: 100, roleId: null, name: 'Legendär' }
        ]
    },
    
    // AutoMod Einstellungen
    automod: {
        antiSpam: { enabled: true, threshold: 5, timeframe: 5000 },
        antiLink: { enabled: true, allowedDomains: ['discord.com', 'roblox.com'] },
        antiInvite: { enabled: true },
        antiMentionSpam: { enabled: true, threshold: 5 },
        antiCaps: { enabled: true, threshold: 0.7 },
        antiBadwords: { enabled: true },
        scamProtection: { enabled: true }
    },
    
    // Moderation
    moderation: {
        maxPurgeAmount: parseInt(process.env.MAX_PURGE_AMOUNT) || 100,
        defaultTimeoutDuration: 3600000 // 1 Stunde
    },
    
    // Logging Channels (werden automatisch erstellt wenn nicht vorhanden)
    logChannels: {
        joins: 'join-logs',
        leaves: 'leave-logs',
        tickets: 'ticket-logs',
        moderation: 'mod-logs',
        shop: 'shop-logs',
        errors: 'error-logs'
    },
    
    // API Einstellungen
    api: {
        port: parseInt(process.env.API_PORT) || 3000
    },
    
    // Security
    security: {
        rateLimitWindow: 60000,
        rateLimitMax: 10,
        verificationCodeLength: 8
    }
};
