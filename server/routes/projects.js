const express = require('express');
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
const OpenAI = require('openai');
const router = express.Router();

// Middleware für Authentifizierung
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Kein Token bereitgestellt' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Ungültiges Token' });
  }
};

// OpenAI Client initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Alle Projekte des Users abrufen
router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error('Fehler beim Abrufen der Projekte:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Projekte' });
  }
});

// Neues Projekt erstellen
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, board, description } = req.body;

    if (!name || !board) {
      return res.status(400).json({ message: 'Name und Board sind erforderlich' });
    }

    const project = new Project({
      userId: req.userId,
      name,
      board,
      description: description || ''
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Fehler beim Erstellen des Projekts:', error);
    res.status(500).json({ message: 'Serverfehler beim Erstellen des Projekts' });
  }
});

// Projekt nach ID abrufen
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!project) {
      return res.status(404).json({ message: 'Projekt nicht gefunden' });
    }

    res.json(project);
  } catch (error) {
    console.error('Fehler beim Abrufen des Projekts:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen des Projekts' });
  }
});

// Projekt aktualisieren
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, code, components, chatHistory } = req.body;
    
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!project) {
      return res.status(404).json({ message: 'Projekt nicht gefunden' });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (code !== undefined) project.code = code;
    if (components !== undefined) project.components = components;
    if (chatHistory !== undefined) project.chatHistory = chatHistory;

    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Projekts:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Projekts' });
  }
});

// Projekt löschen
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!project) {
      return res.status(404).json({ message: 'Projekt nicht gefunden' });
    }

    res.json({ message: 'Projekt erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Projekts:', error);
    res.status(500).json({ message: 'Serverfehler beim Löschen des Projekts' });
  }
});

// KI-Code generieren
router.post('/:id/generate', authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt ist erforderlich' });
    }

    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!project) {
      return res.status(404).json({ message: 'Projekt nicht gefunden' });
    }

    // Board-spezifische Instruktionen
    const boardInstructions = {
      'ESP32-S3': 'Generiere Arduino C++ Code für ESP32-S3. Verwende die Arduino IDE Bibliotheken.',
      'ESP32': 'Generiere Arduino C++ Code für ESP32. Verwende die Arduino IDE Bibliotheken.',
      'Arduino Uno': 'Generiere Arduino C++ Code für Arduino Uno (ATmega328P).',
      'Arduino Nano': 'Generiere Arduino C++ Code für Arduino Nano.',
      'Raspberry Pi Pico': 'Generiere MicroPython Code für Raspberry Pi Pico.',
      'STM32': 'Generiere Arduino C++ Code für STM32 Boards.',
      'ATmega328P': 'Generiere Arduino C++ Code für ATmega328P.'
    };

    const systemPrompt = `Du bist ein erfahrener Embedded-Systems-Entwickler. 
${boardInstructions[project.board] || 'Generiere passenden Code für das Mikrocontroller-Board.'}

Antworte IMMER im folgenden JSON-Format:
{
  "code": "Der vollständige Code als String",
  "components": ["Liste der benötigten Komponenten"],
  "explanation": "Kurze Erklärung des Codes"
}

Wichtig: Gib NUR das JSON-Objekt zurück, keinen zusätzlichen Text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseContent = completion.choices[0].message.content;
    
    // JSON aus der Antwort extrahieren
    let generatedData;
    try {
      // Versuch, JSON aus dem Response zu parsen
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedData = JSON.parse(jsonMatch[0]);
      } else {
        generatedData = JSON.parse(responseContent);
      }
    } catch (parseError) {
      console.error('JSON-Parsing-Fehler:', parseError);
      return res.status(500).json({ message: 'Fehler beim Parsen der KI-Antwort' });
    }

    // Chat-Historie aktualisieren
    const newChatEntry = {
      role: 'user',
      content: prompt
    };
    
    const aiResponseEntry = {
      role: 'assistant',
      content: JSON.stringify(generatedData)
    };

    project.chatHistory = [...project.chatHistory, newChatEntry, aiResponseEntry];
    project.code = generatedData.code;
    project.components = generatedData.components;
    project.description = generatedData.explanation;

    await project.save();

    res.json({
      code: generatedData.code,
      components: generatedData.components,
      explanation: generatedData.explanation,
      chatHistory: project.chatHistory
    });
  } catch (error) {
    console.error('Fehler bei der Code-Generierung:', error);
    res.status(500).json({ message: 'Fehler bei der Code-Generierung durch KI' });
  }
});

module.exports = router;
