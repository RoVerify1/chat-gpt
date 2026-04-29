# 🎮 Roblox Account Linking & Shop System

Ein vollständiges Full-Stack System für eine Roblox Shop-Website mit Account-Verknüpfung und Item-Redemption.

## 📋 Features

### Website
- **Login/Registrierung** mit OTP-Verifizierung
- **Deutsch/English** Sprachumschaltung
- **Roblox Account Linking** - Verbinde dein Roblox-Konto
- **Shop** - Kaufe Items mit Code-Generierung
- **Inventar** - Alle gekauften Items im Überblick
- **Modernes Dark Gaming UI** - Neon-Akzente, Roblox/Discord-Style

### Roblox Spiel
- **Automatisches GUI** - Wird beim Spawn erstellt
- **Account Linking Tab** - Code generieren & verknüpfen
- **Item Redemption Tab** - Gekaufte Codes einlösen
- **Leaderstats Integration** - "Verified" Status wird angezeigt
- **Item Verteilung** - Automatische Item-Vergabe nach Einlösung

---

## 🚀 Installation

### 1. Backend Setup

```bash
cd /workspace
npm install
npm start
```

Der Server startet auf `http://localhost:3000`

### 2. Website öffnen

Öffne `http://localhost:3000` in deinem Browser

### 3. Roblox Studio Setup

1. Öffne Roblox Studio
2. Gehe zu **Game Settings** → **Security**
3. Aktiviere **Enable HTTP Requests**
4. Erstelle ein **LocalScript** in **StarterGui**
5. Kopiere den Inhalt von `roblox/AccountLinkingScript.lua`
6. Ändere `API_URL` zu deiner Server-URL (für Production: HTTPS!)

---

## 📖 Benutzung

### Website Flow

1. **Login/Registrieren**
   - Username und Passwort eingeben
   - OTP Code erscheint in der Server-Konsole
   - OTP eingeben und verifizieren

2. **Roblox Account verknüpfen**
   - Auf "Code generieren" klicken
   - Code notieren
   - Im Roblox Spiel eingeben

3. **Items kaufen**
   - Zum Shop navigieren
   - Item auswählen und kaufen
   - Item Code wird angezeigt

4. **Im Roblox Spiel einlösen**
   - GUI mit 🛒 Button öffnen
   - Zum "Redeem Item" Tab wechseln
   - Code eingeben und einlösen
   - Item wird automatisch gegeben

### Roblox GUI

- **🛒 Button** (unten rechts) - Öffnet/schließt das GUI
- **Link Account Tab** - Code generieren für Account-Verknüpfung
- **Redeem Item Tab** - Item Codes von der Website einlösen

---

## 📁 Projektstruktur

```
/workspace
├── server/
│   └── index.js          # Express Backend API
├── public/
│   ├── index.html        # Website HTML
│   ├── styles.css        # Dark Gaming CSS
│   └── app.js            # Frontend JavaScript
├── roblox/
│   └── AccountLinkingScript.lua  # Roblox Script
├── data/                  # JSON Datenbank (wird auto. erstellt)
│   ├── users.json
│   ├── codes.json
│   ├── products.json
│   └── orders.json
└── README.md
```

---

## 🔌 API Endpunkte

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/api/login` | Login/Register mit Username |
| POST | `/api/verify-otp` | OTP Code verifizieren |
| POST | `/api/generate-link-code` | Link-Code generieren |
| POST | `/api/verify-code` | Code mit Roblox-ID verknüpfen |
| GET | `/api/products` | Alle Produkte laden |
| POST | `/api/buy-product` | Produkt kaufen |
| POST | `/api/redeem-item` | Item Code einlösen |

---

## 🔒 Sicherheit

- Codes laufen nach **5 Minuten** ab
- Jeder Code kann nur **einmal** verwendet werden
- OTP-Codes für Login-Verifizierung
- Nur verifizierte User können kaufen
- Automatische Cleanup-Funktion für expired Codes

---

## 🎨 Customization

### Produkte anpassen

Bearbeite `server/index.js`:

```javascript
if (!fs.existsSync(PRODUCTS_FILE)) {
    const products = [
        { 
            id: 1, 
            name_de: "Neon Schwert", 
            name_en: "Neon Sword", 
            price: 100, 
            modelId: "SwordModel" 
        },
        // Weitere Produkte...
    ];
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products));
}
```

### Items im Spiel anpassen

Bearbeite `roblox/AccountLinkingScript.lua`:

```lua
function giveItemToPlayer(modelId)
    if modelId == "SwordModel" then
        local sword = Instance.new("Tool")
        sword.Name = "Neon Sword"
        sword.Parent = PLAYER.Backpack
    elseif modelId == "VIPBadge" then
        -- Gib VIP
    end
end
```

---

## 💡 Tipps

1. **Für Production**: Hoste den Server (Heroku, Railway, Render)
2. **HTTPS**: Für Roblox HTTP Requests MUSS HTTPS verwendet werden
3. **Datenbank**: Für Production MongoDB oder PostgreSQL verwenden
4. **Payment**: Echtes Payment-System integrieren (Stripe, PayPal)

---

## 🐛 Troubleshooting

**Roblox HTTP Error:**
- Stelle sicher dass HttpService aktiviert ist (Game Settings → Security)
- Verwende HTTPS für Production (localhost funktioniert nur im Test)
- Checke Firewall-Einstellungen

**OTP nicht erhalten:**
- OTP wird in der Server-Konsole angezeigt (Terminal)
- Terminal offen lassen während des Logins

**Code funktioniert nicht:**
- Code ist nach 5 Minuten ungültig
- Code wurde bereits verwendet
- API_URL muss korrekt sein

---

## 📄 Lizenz

Frei für Schulprojekte und persönliche Nutzung.

---

## 👨‍💻 Autor

Erstellt für Roblox Account Linking System Tutorial.
