# XerionX - Roblox Assets Platform

Ein digitaler Shop für Roblox-Assets (Scripts/Models) mit Code-Einlösung im Spiel.

## 📁 Projektstruktur

```
xerionx/
├── public/
│   └── index.html          # Frontend (Single Page Application)
├── roblox/
│   └── RedemptionScript.lua # Roblox Luau Script
├── server.js               # Node.js Backend
├── package.json            # Dependencies
├── .env.example            # Environment Variablen Vorlage
└── README.md               # Diese Datei
```

## 🚀 Lokale Entwicklung

### 1. MongoDB installieren und starten

**Windows:**
```bash
# MongoDB Compass herunterladen oder MongoDB Server installieren
# MongoDB Service starten
net start MongoDB
```

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 2. Backend einrichten

```bash
# Installation der Abhängigkeiten
npm install

# .env Datei erstellen
cp .env.example .env

# .env bearbeiten und MongoDB URI anpassen
# MONGODB_URI=mongodb://localhost:27017/xerionx

# Server starten
npm start
```

Der Server läuft nun unter `http://localhost:3000`

### 3. Frontend testen

Öffne `http://localhost:3000` in deinem Browser.

## 🌐 Deployment

### Backend auf Render.com hosten

1. **GitHub Repository erstellen**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/DEIN_USERNAME/xerionx.git
   git push -u origin main
   ```

2. **Render.com Dashboard**
   - Gehe zu https://render.com
   - Klicke "New +" → "Web Service"
   - Verbinde dein GitHub Repository
   - Konfiguration:
     - **Name**: xerionx-backend
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free

3. **MongoDB Atlas einrichten**
   - Gehe zu https://www.mongodb.com/cloud/atlas
   - Erstelle einen kostenlosen Cluster (M0)
   - Erstelle einen Database User
   - Whiteliste alle IPs (0.0.0.0/0) für Development
   - Hole die Connection String
   - Format: `mongodb+srv://<username>:<password>@cluster.mongodb.net/xerionx`

4. **Environment Variables in Render setzen**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/xerionx
   PORT=3000
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

5. **Deploy!**
   - Render baut und deployed automatisch bei jedem Push

### Frontend auf Vercel hosten

1. **Vercel Dashboard**
   - Gehe zu https://vercel.com
   - Klicke "Add New..." → "Project"
   - Importiere dein GitHub Repository

2. **Konfiguration**
   - **Framework Preset**: Other
   - **Root Directory**: `./public`
   - **Build Command**: leer lassen
   - **Output Directory**: leer lassen

3. **API URL anpassen**
   - In `public/index.html` die API_URL Variable aktualisieren:
   ```javascript
   const API_URL = 'https://your-render-backend.onrender.com/api';
   ```

4. **Deploy!**
   - Vercel deployed automatisch bei jedem Push

## 🎮 Roblox Integration

### Setup in Roblox Studio

1. **HttpService aktivieren**
   - Game Settings → Security
   - "Enable HTTP Requests" aktivieren

2. **GUI erstellen**
   - StarterGui → ScreenGui erstellen
   - TextButton hinzufügen

3. **Script einfügen**
   - Das `RedemptionScript.lua` in den TextButton einfügen
   - BACKEND_URL im Script anpassen:
   ```lua
   local BACKEND_URL = "https://your-render-backend.onrender.com/api"
   ```

4. **Testen**
   - Starte das Spiel in Roblox Studio
   - Klicke auf den Button
   - Gib einen Code ein (z.B. XER-ABCD)

## 📖 API Endpoints

### Öffentliche Endpoints

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/products` | Alle Produkte abrufen |
| POST | `/api/create-order` | Bestellung erstellen & Code generieren |
| GET | `/api/redeem/:code` | Code einlösen & Download-Link erhalten |

### Admin Endpoints

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | `/api/products` | Neues Produkt hinzufügen |
| GET | `/api/codes` | Alle generierten Codes anzeigen |
| DELETE | `/api/products/:id` | Produkt löschen |

## 🔧 Features

### Frontend
- ✅ Modernes Dark Mode Design (#050505)
- ✅ Orange Primärfarbe (#ff6a00)
- ✅ Glassmorphism Effekte
- ✅ Responsive Design
- ✅ Warenkorb-Funktionalität
- ✅ Code-Einlösung mit Validierung
- ✅ Admin Panel für Produktverwaltung
- ✅ Animated Particles im Hero-Bereich

### Backend
- ✅ RESTful API mit Express
- ✅ MongoDB mit Mongoose
- ✅ CORS Support
- ✅ Einzigartige Code-Generierung
- ✅ Code-Nachverfolgung (genutzt/offen)
- ✅ Fehlerbehandlung

### Roblox Script
- ✅ HttpService Integration
- ✅ Eigene GUI für Ergebnisse
- ✅ Code-Eingabe via TextBox
- ✅ Download-Link Anzeige
- ✅ Fehlerbehandlung
- ✅ Chat-Ausgabe als Backup

## 🛠️ Troubleshooting

### MongoDB Verbindungsfehler
```bash
# MongoDB Status prüfen
systemctl status mongod

# MongoDB neu starten
sudo systemctl restart mongod
```

### CORS Fehler im Browser
- Stelle sicher, dass die FRONTEND_URL in server.js korrekt ist
- Für Development: localhost URLs erlauben

### Roblox HttpService Error
- Überprüfe ob HTTP Requests in Game Settings aktiviert sind
- Teste die API URL im Browser
- Prüfe die Render.com Logs auf Fehler

## 📝 Beispiel Workflow

1. **Admin fügt Produkt hinzu**
   - Name: "Epic Sword Script"
   - Preis: 500 R$
   - Download Link: https://example.com/sword.zip

2. **Kunde kauft im Shop**
   - Legt Produkt in Warenkorb
   - Klickt Checkout
   - Erhält Code: XER-7A2B

3. **Kunde löst ein in Roblox**
   - Join das Spiel
   - Klickt Redeem Button
   - Gibt ein: XER-7A2B
   - Erhält Download Link im Game

## ⚠️ Wichtige Hinweise

- **Sicherheit**: Das aktuelle System ist für Demo-Zwecke. Für Production solltest du:
  - Authentication für Admin-Endpoints hinzufügen
  - Rate Limiting implementieren
  - Input Validation verstärken
  - HTTPS erzwingen

- **Roblox Richtlinien**: Stelle sicher, dass dein System die Roblox Terms of Service einhält

- **Payment**: Die Robux-Zahlung wird simuliert. Für echte Zahlungen benötigst du ein alternatives Payment-System

## 📄 Lizenz

MIT License - Frei für kommerzielle und nicht-kommerzielle Nutzung

---

**XerionX** - Next Generation Roblox Assets Platform 🚀
