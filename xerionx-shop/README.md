# XerionX Shop - Roblox Integration

Ein moderner Online-Shop für Roblox Assets mit OTP-Authentifizierung und Roblox-Integration.

## Features

- 🔐 **OTP-Authentifizierung** - Sichere Anmeldung per E-Mail
- 🎮 **Roblox-Integration** - Verknüpfung mit Roblox-Accounts
- 🛒 **Produktkatalog** - Anzeige von Assets, Scripts und UI Kits
- 💳 **Kaufsystem** - Einfacher Kaufprozess mit automatischer Lieferung
- 🎨 **Modernes Design** - Glassmorphism UI mit Orange-Akzenten
- 📱 **Responsive** - Funktioniert auf allen Geräten

## Installation

1. **Abhängigkeiten installieren:**
```bash
npm install
```

2. **Umgebungsvariablen konfigurieren:**
```bash
cp .env.example .env
```

Bearbeite die `.env` Datei mit deinen Daten:
- `JWT_SECRET` - Geheimer Schlüssel für JWT-Token
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` - E-Mail-Konfiguration für OTP
- `ROBLOX_API_KEY` - Dein Roblox API Key (optional für erweiterte Integration)

3. **Server starten:**
```bash
npm start
```

Für Development mit Auto-Reload:
```bash
npm run dev
```

4. **Öffne den Browser:**
```
http://localhost:3000
```

## API Endpoints

### Authentifizierung
- `POST /api/auth/request-otp` - Sende OTP Code per E-Mail
- `POST /api/auth/verify-otp` - Verifiziere OTP und erhalte Token
- `GET /api/auth/me` - Hole aktuelle Benutzerdaten

### Benutzer
- `POST /api/user/link-roblox` - Verknüpfe Roblox-Account

### Produkte
- `GET /api/products` - Hole alle Produkte
- `POST /api/purchase` - Kaufe ein Produkt

## Entwicklung

### Projektstruktur
```
xerionx-shop/
├── server.js          # Backend Server
├── public/
│   └── index.html     # Frontend Anwendung
├── .env               # Umgebungsvariablen
├── .env.example       # Beispiel Konfiguration
└── package.json       # Abhängigkeiten
```

### Technologie-Stack
- **Backend:** Node.js, Express
- **Frontend:** HTML, TailwindCSS, Vanilla JS
- **Auth:** JWT, OTP per E-Mail
- **Styling:** Glassmorphism Design

## Hinweise

- Im Development-Modus wird der OTP-Code in der Console angezeigt, wenn E-Mail-Versand fehlschlägt
- Für Produktionsbetrieb: Datenbank für Users und OTPs verwenden
- Roblox API Integration kann erweitert werden für automatische Item-Lieferung

## Lizenz

ISC
