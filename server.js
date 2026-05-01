const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-Memory Storage für Demo-Zwecke (in Produktion: Datenbank verwenden)
const users = new Map(); // Speichert Benutzer mit E-Mail als Key
const otpCodes = new Map(); // Speichert OTP-Codes mit E-Mail als Key

// Nodemailer Transporter konfigurieren
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kiblox.conntact@gmail.com',
        pass: process.env.EMAIL_PASSWORD // Passwort über Umgebungsvariable laden
    }
});

// Route: Anmeldung - OTP Code anfordern
app.post('/api/request-otp', async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Ungültige E-Mail-Adresse' });
    }

    try {
        // 6-stelligen OTP Code generieren
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // OTP Code speichern (läuft nach 5 Minuten ab)
        otpCodes.set(email, {
            code: otpCode,
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 Minuten
        });

        // E-Mail vorbereiten
        const mailOptions = {
            from: 'kiblox.conntact@gmail.com',
            to: email,
            subject: 'Dein Anmelde-Code',
            html: `
                <h1>Anmeldung</h1>
                <p>Dein Anmelde-Code lautet:</p>
                <h2 style="color: #4CAF50; font-size: 24px;">${otpCode}</h2>
                <p>Dieser Code ist 5 Minuten gültig.</p>
                <p>Falls du diese Anfrage nicht gestellt hast, ignoriere bitte diese E-Mail.</p>
            `
        };

        // E-Mail senden
        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            message: 'OTP Code wurde an deine E-Mail gesendet' 
        });

    } catch (error) {
        console.error('Fehler beim Senden der E-Mail:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Fehler beim Senden der E-Mail. Bitte versuche es später erneut.' 
        });
    }
});

// Route: OTP Code verifizieren
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'E-Mail und OTP Code sind erforderlich' });
    }

    const otpData = otpCodes.get(email);

    if (!otpData) {
        return res.status(400).json({ 
            success: false, 
            message: 'Kein OTP Code für diese E-Mail gefunden. Bitte fordere einen neuen Code an.' 
        });
    }

    // Prüfen ob OTP abgelaufen ist
    if (Date.now() > otpData.expiresAt) {
        otpCodes.delete(email);
        return res.status(400).json({ 
            success: false, 
            message: 'Der OTP Code ist abgelaufen. Bitte fordere einen neuen Code an.' 
        });
    }

    // OTP Code prüfen
    if (otpData.code !== otp) {
        return res.status(400).json({ 
            success: false, 
            message: 'Ungültiger OTP Code' 
        });
    }

    // OTP erfolgreich verifiziert - Benutzer anmelden/registrieren
    otpCodes.delete(email);
    
    if (!users.has(email)) {
        users.set(email, {
            email: email,
            createdAt: new Date().toISOString()
        });
    }

    res.json({ 
        success: true, 
        message: 'Anmeldung erfolgreich!',
        user: { email: email }
    });
});

// Route: Benutzerstatus prüfen
app.get('/api/user/:email', (req, res) => {
    const { email } = req.params;
    
    if (users.has(email)) {
        res.json({ 
            success: true, 
            registered: true,
            user: users.get(email)
        });
    } else {
        res.json({ 
            success: true, 
            registered: false
        });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
    console.log('Verfügbare Endpunkte:');
    console.log('  POST /api/request-otp - OTP Code anfordern');
    console.log('  POST /api/verify-otp - OTP Code verifizieren');
    console.log('  GET  /api/user/:email - Benutzerstatus prüfen');
});
