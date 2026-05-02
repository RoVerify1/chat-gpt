# Embedded AI Dashboard - Produktionsreife Version

Ein modernes Web-Dashboard für Embedded-Systems-Entwicklung mit KI-Unterstützung (HuggingFace).

## 🚀 Features

### Backend (Node.js/Express)
- **Sichere Authentifizierung**: JWT-basiert mit bcrypt-Passwort-Hashing
- **MongoDB Integration**: Mongoose ODM für Datenmodellierung
- **Rate Limiting**: Schutz vor Missbrauch (API & KI-Endpunkte)
- **Security Headers**: Helmet.js für Sicherheitsheaders
- **CORS**: Konfigurierbare Domain-Zulassung
- **Input Validierung**: express-validator für alle Eingaben
- **HuggingFace Integration**: Qwen2.5-7B-Instruct für Code-Generierung

### Frontend (React/Vite/Tailwind CSS)
- **Modernes UI**: Tailwind CSS für responsives Design
- **Auth-System**: Login/Registrierung mit Protected Routes
- **Dashboard**: Projektübersicht mit Statistiken
- **KI-Chat**: ChatGPT-ähnliches Interface
- **Code-Editor**: Syntax-Highlighting, Kopieren & Download
- **Komponenten-Listen**: Automatische Generierung
- **Chat-Verlauf**: Persistente Speicherung

## 📁 Projektstruktur

```
embedded-ai-dashboard/
├── server/
│   ├── models/
│   │   ├── User.js          # User-Modell mit Passwort-Hashing
│   │   └── Project.js       # Projekt-Modell mit Chat-History
│   ├── routes/
│   │   ├── auth.js          # Auth-Routen (Login/Register)
│   │   └── projects.js      # Projekt-Routen + KI-Generierung
│   ├── middleware/
│   │   └── auth.js          # JWT Middleware
│   └── server.js            # Hauptserver
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ProjectView.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── api.js           # API-Client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🔧 Installation

### Voraussetzungen
- Node.js 18+ 
- MongoDB (lokal oder Atlas)
- HuggingFace API Token

### Schritt 1: Repository klonen
```bash
git clone <repository-url>
cd embedded-ai-dashboard
```

### Schritt 2: Umgebungsvariablen konfigurieren
```bash
cp .env.example .env
```

Bearbeite `.env` und trage deine Werte ein:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/embedded-ai-dashboard
JWT_SECRET=dein_sehr_geheimer_jwt_secret_key_mindestens_32_zeichen
JWT_EXPIRE=7d

# HuggingFace API
HUGGINGFACE_API_KEY=hf_DEIN_TOKEN_HIER
HF_MODEL_ID=Qwen/Qwen2.5-7B-Instruct
HF_API_URL=https://router.huggingface.co/v1/chat/completions

CLIENT_URL=http://localhost:5173
```

### Schritt 3: Dependencies installieren
```bash
# Backend Dependencies
npm install

# Frontend Dependencies
cd client
npm install
cd ..
```

### Schritt 4: MongoDB starten (lokal)
```bash
# macOS mit Homebrew
brew services start mongodb-community

# Ubuntu
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Schritt 5: Anwendung starten

**Backend:**
```bash
npm run dev
```

**Frontend (neuem Terminal):**
```bash
cd client
npm run dev
```

Die Anwendung ist jetzt verfügbar unter:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## 🛡️ Sicherheitsfeatures

1. **Passwort-Sicherheit**
   - bcrypt mit 12 Rounds
   - Passwörter werden nie im Klartext gespeichert

2. **JWT Authentication**
   - Signierte Tokens mit geheimem Schlüssel
   - Automatische Token-Validierung
   - Token-Expiration konfigurierbar

3. **Rate Limiting**
   - 100 Requests pro 15 Minuten (API)
   - 10 Requests pro Minute (KI-Endpunkte)

4. **Input Validierung**
   - Alle Eingaben werden validiert
   - SQL-Injection Schutz durch Mongoose
   - XSS-Schutz durch Escaping

5. **Security Headers**
   - Helmet.js für sichere HTTP-Header
   - CORS-Konfiguration für erlaubte Domains

6. **Error Handling**
   - Keine sensiblen Daten in Production-Fehlermeldungen
   - Strukturierte Fehlerprotokollierung

## 📖 API-Endpunkte

### Authentication
- `POST /api/auth/register` - Neue User registrieren
- `POST /api/auth/login` - User anmelden
- `GET /api/auth/me` - Aktuelle User-Daten

### Projects
- `GET /api/projects` - Alle Projekte des Users
- `GET /api/projects/:id` - Einzelnes Projekt
- `POST /api/projects` - Neues Projekt erstellen
- `PUT /api/projects/:id` - Projekt aktualisieren
- `DELETE /api/projects/:id` - Projekt löschen
- `POST /api/projects/:id/generate` - KI-Code generieren

## 🎯 Verwendung

1. **Registrieren**: Erstelle ein Konto mit Username, E-Mail und Passwort
2. **Projekt erstellen**: Wähle ein Board (ESP32, Arduino, etc.)
3. **KI-Chat nutzen**: Beschreibe dein Projekt (z.B. "Temperatursensor mit OLED")
4. **Code erhalten**: Die KI generiert passenden Code + Komponentenliste
5. **Code verwenden**: Kopieren oder als Datei herunterladen

## 🚀 Production Deployment

### Backend Deployen (z.B. Heroku, Railway, DigitalOcean)
```bash
# Umgebungsvariablen im Hosting-Service setzen
# NODE_ENV=production nicht vergessen!

npm start
```

### Frontend Build
```bash
cd client
npm run build
# Output im /dist Ordner
```

### Statische Dateien servieren
Das `dist`-Verzeichnis kann auf jedem statischen Hosting (Vercel, Netlify, S3) gehostet werden.

## 📝 Beispielprompts für die KI

- "Temperatursensor mit OLED Display für ESP32"
- "NRF24L01 Funkkommunikation zwischen zwei Arduinos"
- "IR-Fernbedienung auslesen mit Raspberry Pi Pico"
- "Webserver auf ESP32 mit Sensor-Daten"
- "Bluetooth BLE Scanner für ESP32-S3"

## ⚠️ Wichtige Hinweise

- **API Keys schützen**: Niemals `.env` ins Git committen
- **MongoDB sichern**: Regelmäßige Backups einplanen
- **HTTPS verwenden**: In Production immer HTTPS aktivieren
- **Monitoring**: Server-Monitoring einrichten (z.B. PM2, New Relic)

## 📄 Lizenz

MIT License - Frei für kommerzielle und private Nutzung.

## 🤝 Support

Bei Fragen oder Problemen bitte ein Issue im Repository eröffnen.

---

**Entwickelt für Embedded-Systems-Enthusiasten** 🚀
