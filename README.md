# Embedded AI Dashboard

Ein modernes Web-Dashboard zur KI-gestützten Code-Generierung für Mikrocontroller-Projekte.

## Features

- **Benutzerauthentifizierung**: Login und Registrierung mit JWT
- **Projektverwaltung**: Erstellen, bearbeiten und löschen von Projekten
- **Board-Auswahl**: ESP32-S3, ESP32, Arduino Uno, Arduino Nano, Raspberry Pi Pico, STM32, ATmega328P
- **KI-Code-Generierung**: ChatGPT-ähnliches Interface zur Code-Generierung
- **Code-Export**: Kopieren oder Herunterladen des generierten Codes
- **Komponenten-Liste**: Automatische Auflistung der benötigten Hardware-Komponenten
- **Chat-Verlauf**: Speicherung der Konversationen pro Projekt

## Technische Architektur

### Frontend
- **React 18** mit Vite
- **Tailwind CSS** für modernes UI-Design
- **React Router** für Navigation
- **Axios** für API-Kommunikation

### Backend
- **Node.js** mit Express
- **MongoDB** mit Mongoose ODM
- **JWT** für Authentifizierung
- **OpenAI API** für Code-Generierung

## Installation

### Voraussetzungen
- Node.js (v16 oder höher)
- MongoDB (lokal oder Atlas)
- OpenAI API Key

### Backend einrichten

```bash
# Installiere Server-Abhängigkeiten
npm install

# Erstelle .env Datei
cp .env.example .env

# Bearbeite .env mit deinen Einstellungen:
# - MONGODB_URI
# - JWT_SECRET
# - OPENAI_API_KEY
# - PORT

# Starte den Server
npm run dev
```

### Frontend einrichten

```bash
# Wechsle ins Client-Verzeichnis
cd client

# Installiere Client-Abhängigkeiten
npm install

# Starte den Development-Server
npm run dev
```

## Ordnerstruktur

```
/workspace
├── server/
│   ├── models/
│   │   ├── User.js
│   │   └── Project.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── projects.js
│   └── server.js
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ProjectView.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── package.json
├── .env.example
└── README.md
```

## API-Endpunkte

### Authentifizierung
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Benutzer anmelden

### Projekte
- `GET /api/projects` - Alle Projekte des Users
- `POST /api/projects` - Neues Projekt erstellen
- `GET /api/projects/:id` - Projekt nach ID abrufen
- `PUT /api/projects/:id` - Projekt aktualisieren
- `DELETE /api/projects/:id` - Projekt löschen
- `POST /api/projects/:id/generate` - Code mit KI generieren

## Verwendung

1. **Registrieren/Anmelden**: Erstelle ein Konto oder melde dich an
2. **Neues Projekt**: Klicke auf "Neues Projekt" und wähle dein Board
3. **KI-Chat**: Beschreibe im Chat, was du bauen möchtest (z.B. "Temperatursensor mit OLED Display")
4. **Code erhalten**: Die KI generiert passenden Code für dein Board
5. **Exportieren**: Kopiere den Code oder lade ihn als .ino/.py Datei herunter

## Beispiel-Prompts

- "Temperatursensor mit OLED Display für ESP32"
- "LED blinken lassen mit Arduino Uno"
- "WiFi Scanner für ESP32-S3"
- "Servo Motor Steuerung mit Raspberry Pi Pico"
- "NRF24L01 Funkkommunikation zwischen zwei ESP32"

## Sicherheitshinweise

- Ändere das `JWT_SECRET` in der `.env` Datei für Production
- Verwende HTTPS für Production-Einsätze
- Speichere keine sensiblen Daten im Klartext
- Rate-Limiting für API-Endpunkte empfohlen

## Lizenz

MIT License

## Support

Bei Fragen oder Problemen erstelle ein Issue im Repository.
