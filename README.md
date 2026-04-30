# 🔗 ZERIONX | Roblox Account Linking System

Ein Full-Stack System zur Verknüpfung von Roblox-Accounts mit einer Website über Code-Verification.

## 🎯 Features

- **Website Frontend**: Modernes Dark Gaming UI mit Neon-Akzenten (Orange #ff6600)
- **Code Generierung**: Zufällige 6-stellige Codes (5 Minuten gültig)
- **Roblox Integration**: Vollständiges Lua-Script für Roblox-Spiele
- **DataStore Support**: Speichert verifizierte Spieler persistent
- **Status Prüfung**: Überprüfe Code- und Account-Status
- **Auto-Polling**: Website erkennt automatisch erfolgreiche Verifizierung

## 📁 Projektstruktur

```
/workspace
├── server/
│   └── index.js          # Node.js Express Backend
├── public/
│   ├── index.html        # Website HTML (ZERIONX Style)
│   └── app.js            # Frontend JavaScript
├── roblox/
│   └── VerificationSystem.lua  # Roblox Script
├── data/
│   ├── codes.json        # Gespeicherte Codes
│   └── users.json        # Verifizierte User
├── package.json
└── README.md
```

## 🚀 Setup

### 1. Backend starten

```bash
cd /workspace
npm start
```

Der Server läuft auf `http://localhost:3000`

### 2. API Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/api/generate-code` | Generiert neuen Verification Code |
| POST | `/api/verify-code` | Verifiziert Code (von Roblox) |
| GET | `/api/status/:code` | Prüft Code Status |
| GET | `/api/user/:id` | Prüft User Status |

### 3. Roblox Script installieren

1. Öffne Roblox Studio
2. Gehe zu **Game Settings → Security**
3. Aktiviere **Allow HTTP Requests** ✅
4. Erstelle ein **Script** in `ServerScriptService`
5. Kopiere den Inhalt von `roblox/VerificationSystem.lua`
6. Passe die `ApiUrl` an deine Server-URL an

## 💡 Verwendung

### Website

1. Öffne `http://localhost:3000`
2. Klicke auf **"Generate Link"**
3. Kopiere den angezeigten Code (z.B. `X7K92P`)

### Roblox Spiel

1. Betrete das Spiel
2. Das Verification-Fenster öffnet sich automatisch
3. Gib den Code ein
4. Klicke auf **"Verify"**
5. Bei Erfolg: Account ist verknüpft! 🎉

### Commands im Spiel

- `/verify` - Öffnet das Verification-Fenster manuell

## 🔒 Sicherheit

- Codes sind nur **5 Minuten** gültig
- Jeder Code kann nur **einmal** verwendet werden
- Automatische Bereinigung abgelaufener Codes
- Roblox UserId wird sicher gespeichert

## 🎨 Design

- **Dark Theme**: Schwarze Hintergründe (#050505)
- **Neon Akzente**: Orange (#ff6600) mit Glow-Effekten
- **Gaming Style**: Inspiriert von Roblox/Discord
- **Responsive**: Funktioniert auf Desktop und Mobile
- **Animationen**: Pulsierende Hintergründe, Hover-Effekte

## 📝 Code Beispiele

### API Request (Generate Code)

```javascript
fetch('/api/generate-code', {
  method: 'POST'
})
.then(res => res.json())
.then(data => console.log(data.code));
```

### API Request (Verify Code)

```javascript
fetch('/api/verify-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'X7K92P',
    robloxUserId: 12345678
  })
});
```

### Roblox HTTP Request

```lua
local HttpService = game:GetService("HttpService")

local response = HttpService:PostAsync(
    "http://localhost:3000/api/verify-code",
    HttpService:JSONEncode({
        code = "X7K92P",
        robloxUserId = player.UserId
    }),
    Enum.HttpContentType.ApplicationJson
)
```

## 🛠️ Entwicklung

### Locales Testen

1. Backend starten: `npm start`
2. Website öffnen: `http://localhost:3000`
3. Roblox Studio im Test-Modus verwenden

### Production Deployment

Für Production musst du:
1. Eine öffentliche URL verwenden (z.B. Replit, Heroku, VPS)
2. Die `ApiUrl` im Roblox Script anpassen
3. HTTPS empfohlen (für Roblox erforderlich!)

## 📄 Lizenz

MIT License - Frei für Schulprojekte und persönliche Nutzung

---

**Viel Spaß beim Verknüpfen! 🎮**
