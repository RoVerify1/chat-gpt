# OTP-Anmeldung mit E-Mail

Dieses Projekt ermöglicht eine sichere Anmeldung mit einem One-Time-Password (OTP), das per E-Mail gesendet wird.

## Funktionen

- **E-Mail-basierte Anmeldung**: Benutzer melden sich nur mit ihrer E-Mail-Adresse an
- **OTP-Code**: Ein 6-stelliger Code wird per E-Mail gesendet
- **Zeitbegrenzung**: Der OTP-Code ist 5 Minuten gültig
- **Responsive Design**: Funktioniert auf Desktop und Mobile

## Voraussetzungen

- Node.js (v14 oder höher)
- npm

## Installation

1. Abhängigkeiten installieren:
```bash
npm install
```

2. E-Mail-Passwort konfigurieren:

Erstelle eine `.env`-Datei im Projektverzeichnis oder setze die Umgebungsvariable `EMAIL_PASSWORD`:

```bash
export EMAIL_PASSWORD="dein-gmail-passwort"
```

**Wichtig**: Für Gmail musst du möglicherweise:
- Die Zwei-Faktor-Authentifizierung aktivieren
- Ein App-Passwort erstellen (nicht dein normales Passwort verwenden)

## Starten

Server starten:
```bash
npm start
```

Der Server läuft dann auf `http://localhost:3000`

## Verwendung

1. Öffne `index.html` in deinem Browser (oder über einen lokalen Webserver)
2. Gib deine E-Mail-Adresse ein
3. Klicke auf "Code anfordern"
4. Überprüfe deine E-Mails auf den 6-stelligen Code
5. Gib den Code ein und klicke auf "Anmelden"

## API-Endpunkte

### POST /api/request-otp
Sendet einen OTP-Code an die angegebene E-Mail.

**Request Body:**
```json
{
  "email": "benutzer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP Code wurde an deine E-Mail gesendet"
}
```

### POST /api/verify-otp
Überprüft den OTP-Code.

**Request Body:**
```json
{
  "email": "benutzer@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Anmeldung erfolgreich!",
  "user": {
    "email": "benutzer@example.com"
  }
}
```

### GET /api/user/:email
Überprüft, ob ein Benutzer registriert ist.

**Response:**
```json
{
  "success": true,
  "registered": true,
  "user": {
    "email": "benutzer@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Sicherheitshinweise

- Dieses Beispiel verwendet In-Memory-Speicher für Benutzerdaten. Für Produktionsnutzung sollte eine Datenbank verwendet werden.
- Das Gmail-Passwort sollte niemals im Code gespeichert werden. Verwende immer Umgebungsvariablen.
- Für Produktionsnutzung sollte HTTPS verwendet werden.

## Lizenz

ISC
