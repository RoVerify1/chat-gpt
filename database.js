/**
 * MongoDB Database Schemas für XerionX Bot
 * Enthält alle Datenbank-Modelle mit Mongoose
 */

const mongoose = require('mongoose');

// User Schema - Speichert Benutzerdaten
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    robloxUsername: { type: String, default: null },
    robloxUserId: { type: Number, default: null },
    verificationCode: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    messagesSent: { type: Number, default: 0 },
    lastXpGain: { type: Date, default: Date.now },
    warnings: [{
        reason: String,
        moderator: String,
        timestamp: { type: Date, default: Date.now }
    }],
    inventory: [{
        productId: String,
        productName: String,
        category: String,
        purchasedAt: { type: Date, default: Date.now },
        orderId: String
    }],
    banned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Produkt Schema - Shop Produkte
const productSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'ROBUX' },
    stock: { type: Number, default: -1 }, // -1 = unbegrenzt
    images: [String],
    deliveryType: { type: String, enum: ['gamepass', 'item', 'script', 'account', 'currency', 'role', 'vip'], required: true },
    deliveryData: { type: mongoose.Schema.Types.Mixed }, // Flexible Daten für Lieferung
    enabled: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    discount: { type: Number, default: 0 }, // Prozent Rabatt
    sales: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviews: [{
        userId: String,
        rating: Number,
        comment: String,
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Bestellung Schema - Kaufhistorie
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    products: [{
        productId: String,
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 }
    }],
    totalAmount: { type: Number, required: true },
    paymentCode: { type: String, required: true, unique: true },
    paymentStatus: { 
        type: String, 
        enum: ['pending', 'paid', 'failed', 'refunded'], 
        default: 'pending' 
    },
    deliveryStatus: { 
        type: String, 
        enum: ['pending', 'delivered', 'failed', 'manual'], 
        default: 'pending' 
    },
    robloxTransactionId: { type: String, default: null },
    deliveredAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    notes: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Ticket Schema - Support Tickets
const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    ticketNumber: { type: Number, required: true },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    category: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['open', 'closed', 'claimed', 'deleted'], 
        default: 'open' 
    },
    claimedBy: { type: String, default: null },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    closedBy: { type: String, default: null },
    transcript: [{
        userId: String,
        userName: String,
        content: String,
        timestamp: { type: Date, default: Date.now },
        attachments: [String]
    }],
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    tags: [String],
    createdAt: { type: Date, default: Date.now }
});

// Guild Schema - Server Einstellungen
const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    guildName: { type: String, required: true },
    welcomeChannel: { type: String, default: null },
    leaveChannel: { type: String, default: null },
    logChannel: { type: String, default: null },
    ticketChannel: { type: String, default: null },
    ticketCategory: { type: String, default: null },
    autoRole: { type: String, default: null },
    modmailChannel: { type: String, default: null },
    prefix: { type: String, default: '/' },
    language: { type: String, default: 'de' },
    automodEnabled: { type: Boolean, default: true },
    levelSystemEnabled: { type: Boolean, default: true },
    shopEnabled: { type: Boolean, default: true },
    verificationRequired: { type: Boolean, default: false },
    robloxGroupId: { type: Number, default: null },
    robloxGroupRankRequired: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Log Schema - Aktivitätslogs
const logSchema = new mongoose.Schema({
    logId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['join', 'leave', 'ticket', 'moderation', 'shop', 'error', 'verification'], 
        required: true 
    },
    action: { type: String, required: true },
    userId: { type: String, default: null },
    userName: { type: String, default: null },
    targetId: { type: String, default: null },
    targetName: { type: String, default: null },
    reason: { type: String, default: null },
    data: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
});

// Blacklist Schema - Gebannte User für Shop
const blacklistSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    reason: { type: String, required: true },
    bannedBy: { type: String, required: true },
    expiresAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});

// Exportiere alle Modelle
module.exports = {
    User: mongoose.model('User', userSchema),
    Product: mongoose.model('Product', productSchema),
    Order: mongoose.model('Order', orderSchema),
    Ticket: mongoose.model('Ticket', ticketSchema),
    Guild: mongoose.model('Guild', guildSchema),
    Log: mongoose.model('Log', logSchema),
    Blacklist: mongoose.model('Blacklist', blacklistSchema)
};
