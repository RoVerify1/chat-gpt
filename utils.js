/**
 * XerionX Utility Functions
 * Common utilities used across the bot
 */

const { EmbedBuilder } = require('discord.js');
const config = require('./config');

/**
 * Create a standardized embed
 */
function createEmbed(title, description, color = config.BOT.EMBED_COLOR) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTimestamp();
    
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    
    return embed;
}

/**
 * Log message to console with timestamp
 */
function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleString();
    console.log(`[${timestamp}] [${type}] ${message}`);
}

/**
 * Validate API Key
 */
function validateApiKey(providedKey) {
    return providedKey === config.ROBLOX.API_KEY;
}

/**
 * Sanitize input string
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[<>]/g, '').trim().slice(0, 2000);
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

/**
 * Generate unique ticket ID
 */
function generateTicketId() {
    return `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

/**
 * Check if user has staff role
 */
function isStaff(member) {
    if (!member || !config.ROLES.STAFF_ROLE) return false;
    return member.roles.cache.has(config.ROLES.STAFF_ROLE);
}

/**
 * Check if user has admin role
 */
function isAdmin(member) {
    if (!member || !config.ROLES.ADMIN_ROLE) return false;
    return member.roles.cache.has(config.ROLES.ADMIN_ROLE);
}

/**
 * Delay execution
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    createEmbed,
    log,
    validateApiKey,
    sanitizeInput,
    formatCurrency,
    generateTicketId,
    isStaff,
    isAdmin,
    delay
};
