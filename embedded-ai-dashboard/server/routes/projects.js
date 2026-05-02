const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// Alle Projekte eines Users abrufen
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id })
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (err) {
    console.error('Fehler beim Abrufen der Projekte:', err);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

// Einzelnes Projekt abrufen
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projekt nicht gefunden'
      });
    }

    // Prüfen ob User berechtigt ist
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Keine Berechtigung für dieses Projekt'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (err) {
    console.error('Fehler beim Abrufen des Projekts:', err);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

// Neues Projekt erstellen
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Projektname ist erforderlich'),
  body('board').isIn(['ESP32-S3', 'ESP32', 'Arduino Uno', 'Arduino Nano', 'Raspberry Pi Pico', 'STM32', 'Other'])
    .withMessage('Ungültiges Board ausgewählt')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, board, description } = req.body;

    const project = await Project.create({
      user: req.user._id,
      name,
      board,
      description: description || ''
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (err) {
    console.error('Fehler beim Erstellen des Projekts:', err);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

// Projekt aktualisieren
router.put('/:id', protect, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projekt nicht gefunden'
      });
    }

    // Prüfen ob User berechtigt ist
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Keine Berechtigung für dieses Projekt'
      });
    }

    // Felder aktualisieren
    const allowedFields = ['name', 'description', 'code', 'components', 'chatHistory'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    await project.save();

    res.json({
      success: true,
      data: project
    });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Projekts:', err);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

// Projekt löschen
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projekt nicht gefunden'
      });
    }

    // Prüfen ob User berechtigt ist
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Keine Berechtigung für dieses Projekt'
      });
    }

    await project.deleteOne();

    res.json({
      success: true,
      message: 'Projekt gelöscht'
    });
  } catch (err) {
    console.error('Fehler beim Löschen des Projekts:', err);
    res.status(500).json({
      success: false,
      message: 'Serverfehler'
    });
  }
});

// KI-Code generieren mit HuggingFace
router.post('/:id/generate', protect, [
  body('prompt').trim().notEmpty().withMessage('Prompt ist erforderlich')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { prompt } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projekt nicht gefunden'
      });
    }

    // Prüfen ob User berechtigt ist
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Keine Berechtigung für dieses Projekt'
      });
    }

    // System-Prompt für Embedded-Systems-KI
    const systemPrompt = `Du bist ein erfahrener Embedded-Systems-Entwickler mit Expertise in Mikrocontrollern wie ESP32, Arduino, Raspberry Pi Pico und drahtloser Kommunikation.
    
Deine Aufgabe ist es, basierend auf den Anforderungen des Nutzers:
1. Vollständigen, funktionsfähigen Code zu generieren
2. Eine Liste der benötigten Komponenten zu erstellen
3. Kurze Erklärungen zum Code zu geben

WICHTIG: 
- Der Code muss für das Board "${project.board}" optimiert sein
- Verwende bewährte Bibliotheken und Best Practices
- Füge Kommentare im Code hinzu
- Achte auf Sicherheit und Effizienz

Antworte IMMER in folgendem JSON-Format:
{
  "code": "vollständiger code hier",
  "components": [{"name": "Komponente", "quantity": 1, "notes": "Hinweise"}],
  "explanation": "kurze erklärung"
}`;

    // Nachricht zum Chat-Verlauf hinzufügen
    project.chatHistory.push({
      role: 'user',
      content: prompt
    });

    // HuggingFace API aufrufen
    const response = await axios.post(
      process.env.HF_API_URL,
      {
        model: process.env.HF_MODEL_ID,
        messages: [
          { role: 'system', content: systemPrompt },
          ...project.chatHistory.slice(-10), // Letzte 10 Nachrichten für Kontext
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    // Versuchen, JSON zu parsen
    let parsedResponse;
    try {
      // JSON aus der Antwort extrahieren
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Kein gültiges JSON gefunden');
      }
    } catch (parseErr) {
      // Fallback wenn JSON-Parsing fehlschlägt
      parsedResponse = {
        code: aiResponse,
        components: [],
        explanation: 'Automatisch generierte Antwort - JSON-Parsing fehlgeschlagen'
      };
    }

    // KI-Antwort zum Chat-Verlauf hinzufügen
    project.chatHistory.push({
      role: 'assistant',
      content: JSON.stringify(parsedResponse)
    });

    // Code und Components speichern
    if (parsedResponse.code) {
      project.code = parsedResponse.code;
    }
    if (parsedResponse.components && Array.isArray(parsedResponse.components)) {
      project.components = parsedResponse.components;
    }

    await project.save();

    res.json({
      success: true,
      data: parsedResponse,
      chatHistory: project.chatHistory
    });
  } catch (err) {
    console.error('Fehler bei der Code-Generierung:', err.message);
    
    if (err.response) {
      return res.status(err.response.status).json({
        success: false,
        message: `KI-API Fehler: ${err.response.status} - ${JSON.stringify(err.response.data)}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Fehler bei der Code-Generierung. Bitte prüfen Sie Ihre HuggingFace API-Einstellungen.'
    });
  }
});

module.exports = router;
