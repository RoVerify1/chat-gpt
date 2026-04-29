const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- DATENBANK (JSON Dateien) ---
const DB_PATH = './data';
const USERS_FILE = path.join(DB_PATH, 'users.json');
const CODES_FILE = path.join(DB_PATH, 'codes.json');
const PRODUCTS_FILE = path.join(DB_PATH, 'products.json');
const ORDERS_FILE = path.join(DB_PATH, 'orders.json');

// Initialisiere Datenbanken wenn sie nicht existieren
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(CODES_FILE)) {
    fs.writeFileSync(CODES_FILE, JSON.stringify([]));
}
if (!fs.existsSync(PRODUCTS_FILE)) {
    // Beispiel Produkte
    const products = [
        { id: 1, name_de: "Neon Schwert", name_en: "Neon Sword", price: 100, image: "sword.png", modelId: "SwordModel" },
        { id: 2, name_de: "VIP Pass", name_en: "VIP Pass", price: 500, image: "vip.png", modelId: "VIPBadge" },
        { id: 3, name_de: "Speed Boost", name_en: "Speed Boost", price: 250, image: "speed.png", modelId: "SpeedGear" }
    ];
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products));
}
if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
}

// Helper: DB lesen/schreiben
const readDB = (file) => JSON.parse(fs.readFileSync(file));
const writeDB = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// --- AUTH & OTP SYSTEM ---

// Login/Register
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readDB(USERS_FILE);
    
    let user = users.find(u => u.username === username);
    
    if (!user) {
        // Neuer User
        user = { 
            id: Date.now(), 
            username, 
            password,
            robloxId: null,
            verified: false 
        };
        users.push(user);
        writeDB(USERS_FILE, users);
    } else {
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: "Falsches Passwort" });
        }
    }

    // OTP generieren
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.tempOtp = otp;
    user.tempOtpExpiry = Date.now() + 5 * 60 * 1000;
    writeDB(USERS_FILE, users);

    console.log(`[OTP] Code für ${username}: ${otp}`);
    
    res.json({ success: true, message: "OTP gesendet (siehe Server-Konsole)", userId: user.id });
});

// OTP Verifizieren
app.post('/api/verify-otp', (req, res) => {
    const { userId, otp } = req.body;
    const users = readDB(USERS_FILE);
    const user = users.find(u => u.id == userId);

    if (!user) return res.status(404).json({ success: false, message: "User nicht gefunden" });
    
    if (user.tempOtp === otp && Date.now() < user.tempOtpExpiry) {
        user.verified = true;
        user.tempOtp = null;
        writeDB(USERS_FILE, users);
        
        res.json({ success: true, token: user.id, username: user.username });
    } else {
        res.status(400).json({ success: false, message: "Ungültiger oder abgelaufener OTP Code" });
    }
});

// --- ROBLOX LINKING ---

app.post('/api/generate-link-code', (req, res) => {
    const codes = readDB(CODES_FILE);
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    codes.push({
        code: newCode,
        linked: false,
        robloxUserId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    writeDB(CODES_FILE, codes);
    res.json({ success: true, code: newCode, expiresIn: 300 });
});

app.post('/api/verify-code', (req, res) => {
    const { code, robloxUserId } = req.body;
    const codes = readDB(CODES_FILE);
    const codeEntry = codes.find(c => c.code === code);

    if (!codeEntry) return res.status(404).json({ success: false, message: "Code nicht gefunden" });
    if (codeEntry.linked) return res.status(400).json({ success: false, message: "Code bereits verwendet" });
    if (Date.now() > codeEntry.expiresAt) return res.status(400).json({ success: false, message: "Code abgelaufen" });

    codeEntry.linked = true;
    codeEntry.robloxUserId = robloxUserId;
    writeDB(CODES_FILE, codes);

    res.json({ success: true, message: "Account erfolgreich verknüpft!" });
});

// --- SHOP & ITEMS SYSTEM ---

app.get('/api/products', (req, res) => {
    const products = readDB(PRODUCTS_FILE);
    res.json({ success: true, products });
});

app.post('/api/buy-product', (req, res) => {
    const { userId, productId } = req.body;
    const users = readDB(USERS_FILE);
    const products = readDB(PRODUCTS_FILE);
    const orders = readDB(ORDERS_FILE);

    const user = users.find(u => u.id == userId);
    const product = products.find(p => p.id === productId);

    if (!user || !product) return res.status(404).json({ success: false, message: "User oder Produkt nicht gefunden" });
    if (!user.verified) return res.status(403).json({ success: false, message: "Account nicht verifiziert" });

    const itemCode = "ITEM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    orders.push({
        orderId: Date.now(),
        userId,
        productId,
        itemName: product.name_de,
        itemCode,
        modelId: product.modelId,
        redeemed: false,
        createdAt: Date.now()
    });
    
    writeDB(ORDERS_FILE, orders);

    res.json({ 
        success: true, 
        message: "Kauf erfolgreich!", 
        itemCode, 
        productName: product.name_de,
        robloxPlaceId: 0
    });
});

app.post('/api/redeem-item', (req, res) => {
    const { code, robloxUserId } = req.body;
    const orders = readDB(ORDERS_FILE);
    const order = orders.find(o => o.itemCode === code);

    if (!order) return res.status(404).json({ success: false, message: "Ungültiger Code" });
    if (order.redeemed) return res.status(400).json({ success: false, message: "Code bereits eingelöst" });

    order.redeemed = true;
    order.robloxUserId = robloxUserId;
    writeDB(ORDERS_FILE, orders);

    res.json({ 
        success: true, 
        message: "Item erfolgreich erhalten!", 
        modelId: order.modelId 
    });
});

// Cleanup alter Codes
setInterval(() => {
    const now = Date.now();
    const codes = readDB(CODES_FILE);
    const validCodes = codes.filter(c => now < c.expiresAt && !c.linked);
    if (codes.length !== validCodes.length) {
        writeDB(CODES_FILE, validCodes);
        console.log("[Cleanup] Abgelaufene Codes entfernt.");
    }
}, 600000);

app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
    console.log(`📂 Daten werden in ${DB_PATH} gespeichert.`);
});
