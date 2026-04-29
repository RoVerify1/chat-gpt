# MINT Lab – Lernen mit Technik & KI

Moderne Full-Stack MINT-Schulplattform mit Projektverwaltung (CRUD), Kategorien-Dashboard und integriertem KI-Chatbot.

## Tech Stack
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js + Express
- **Daten:** lokale JSON-Datei (`data/projects.json`)
- **KI:** Hugging Face Inference API mit Demo-Fallback

## Features
- Dashboard mit MINT-Kategorien und moderner Karten-UI
- Projekt-System mit **Create / Read / Update / Delete**
- Kategorie-Filter für Projekte
- Floating KI-Chatbot (ähnlich moderner AI Apps)
- MINT Facts Widget mit rotierenden Fakten
- Dark Theme (SaaS Stil), responsive für Mobile + Desktop

## Setup
```bash
npm install
npm start
```

App läuft auf `http://localhost:3000`.

## Umgebungsvariablen
Optional für echte KI-Antworten:

```bash
HF_API_KEY=dein_token
```

Ohne `HF_API_KEY` antwortet der Chatbot im Demo-Modus.

## API Endpunkte
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/ai/chat`

## Vercel Deployment (Vorbereitung)
Das Projekt kann direkt auf GitHub gepusht und mit Vercel deployt werden.

### Option A: Node.js Server auf Vercel
- Framework Preset: **Other**
- Build Command: *(leer lassen)*
- Start Command: `npm start`

### Option B: Frontend static + separates Backend
- `public/` als statische Quelle verwenden
- Backend in eigenem Deployment bereitstellen

## Projektstruktur
```
.
├── data/
│   └── projects.json
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── server/
│   └── index.js
└── README.md
```
