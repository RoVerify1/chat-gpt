# 🚀 XerionX Bot - Installation & Setup

## 📋 Voraussetzungen

- **Node.js** v18.0.0 oder höher
- **MongoDB** Datenbank (lokal oder MongoDB Atlas)
- **Discord Bot Token** von [Discord Developer Portal](https://discord.com/developers/applications)

---

## 🔧 Installation

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im gleichen Verzeichnis:

```bash
cp .env.example .env
```

Bearbeite die `.env` Datei mit deinen Daten:

```env
# Discord Bot Token
DISCORD_TOKEN=dein_bot_token_hier
DISCORD_CLIENT_ID=deine_client_id_hier
DISCORD_GUILD_ID=deine_server_id_hier

# MongoDB Connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/xerionx

# Optional: Roblox Cookie für erweiterte Features
ROBLOX_COOKIE=dein_roblox_cookie

# Bot Einstellungen
BOT_NAME=XerionX
SHOP_NAME=XerionX Shop
API_PORT=3000
LOG_LEVEL=info
```

### 3. Slash Commands registrieren

```bash
npm run deploy
```

Dies registriert alle Slash Commands bei Discord. Bei globaler Registrierung kann es bis zu 1 Stunde dauern. Für schnelleres Testing kannst du eine `DISCORD_GUILD_ID` in der `.env` setzen.

### 4. Bot starten

```bash
npm start
```

Oder im Development Mode mit Auto-Reload:

```bash
npm run dev
```

---

## 🎯 Erste Schritte

### Bot einladen

Erstelle einen Einladelink unter: `https://discord.com/oauth2?client_id=DEINE_CLIENT_ID&scope=bot%20applications.commands&permissions=8`

**Benötigte Permissions:**
- Administrator (oder folgende spezifische):
  - Nachrichten senden
  - Embeds senden
  - Channels verwalten
  - Rollen verwalten
  - Nachrichten verwalten

### Datenbank einrichten

#### Option A: MongoDB Atlas (Empfohlen)

1. Gehe zu [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Erstelle einen kostenlosen Cluster
3. Erstelle einen Database User
4. Whiteliste alle IPs (0.0.0.0/0) für Testing
5. Kopiere die Connection String in deine `.env`

#### Option B: Lokale MongoDB

```bash
# Installiere MongoDB lokal
# Starte MongoDB Service
mongod

# Connection String in .env:
MONGODB_URI=mongodb://localhost:27017/xerionx
```

---

## 🛒 Shop einrichten

### Erstes Produkt erstellen

Da es noch kein Admin Panel gibt, erstelle Produkte direkt in der Datenbank:

```javascript
// In MongoDB Compass oder Shell:
db.products.insertOne({
    productId: "00343",
    name: "VIP Rang",
    description: "Exklusiver VIP Rang mit besonderen Features",
    category: "vip",
    price: 500,
    currency: "ROBUX",
    stock: -1,
    deliveryType: "role",
    deliveryData: { roleId: "DEINE_ROLE_ID" },
    enabled: true,
    featured: true
})
```

---

## 📁 Dateistruktur

Alle Dateien befinden sich im Hauptverzeichnis (keine Unterordner):

```
xerionx-bot/
├── index.js              # Hauptdatei
├── deploy-commands.js    # Command Deployment
├── config.js             # Konfiguration
├── database.js           # MongoDB Schemas
├── embeds.js             # Premium UI Embeds
├── logger.js             # Logging System
├── evt-ready.js          # Ready Event
├── evt-interactionCreate.js # Button/Menu Handler
├── evt-guildMemberAdd.js # Welcome System
├── cmd-shop.js           # Shop Command
├── cmd-buy.js            # Buy Command
├── cmd-ticket.js         # Ticket Command
├── cmd-link.js           # Roblox Link Command
├── cmd-help.js           # Help Command
├── cmd-ping.js           # Ping Command
├── package.json
├── .env.example
└── README.md
```

---

## 🔐 Sicherheit

- **Token niemals teilen!**
- `.env` Datei zu `.gitignore` hinzufügen
- Rate Limiting ist aktiviert
- Blacklist System für Shop vorhanden

---

## 🆘 Support

Bei Problemen:

1. Prüfe die Log-Dateien im `logs/` Ordner
2. Stelle sicher, dass alle Environment Variablen korrekt sind
3. Überprüfe die Bot Permissions auf deinem Server
4. Teste mit `npm run dev` für detaillierte Logs

---

## 📊 Commands Übersicht

| Command | Beschreibung |
|---------|-------------|
| `/shop` | Öffnet den Premium Shop |
| `/buy <item>` | Kauft ein Produkt |
| `/ticket` | Erstellt Support Ticket |
| `/link <username>` | Verknüpft Roblox Account |
| `/help` | Zeigt Hilfe Menü |
| `/ping` | Zeigt Bot Latenz |

---

## 🎨 Anpassung

Die `config.js` Datei enthält alle anpassbaren Einstellungen:

- Farben
- Emojis
- Ticket Kategorien
- Shop Kategorien
- Level System
- AutoMod Einstellungen

---

**Viel Erfolg mit deinem XerionX Bot! 🚀**
