const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '..', 'data', 'projects.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const fallbackProjects = [
  {
    id: cryptoRandomId(),
    title: 'Einführung in Arduino LEDs',
    category: 'Arduino / ESP32',
    description: 'Steuere eine LED mit digitalWrite und lerne erste Hardware-Grundlagen.',
    difficulty: 'Einsteiger',
    date: '2026-04-29'
  },
  {
    id: cryptoRandomId(),
    title: 'Python Schleifen-Challenge',
    category: 'Programmieren',
    description: 'Übe for- und while-Schleifen mit kleinen MINT-Aufgaben.',
    difficulty: 'Mittel',
    date: '2026-04-29'
  }
];

function cryptoRandomId() {
  return `proj_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(fallbackProjects, null, 2), 'utf-8');
  }
}

async function readProjects() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

async function writeProjects(projects) {
  await fs.writeFile(DATA_FILE, JSON.stringify(projects, null, 2), 'utf-8');
}

app.get('/api/projects', async (req, res) => {
  try {
    const { category } = req.query;
    const projects = await readProjects();
    const filtered = category && category !== 'Alle'
      ? projects.filter((project) => project.category === category)
      : projects;
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: 'Fehler beim Laden der Projekte.' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { title, category, description, difficulty, date } = req.body;

    if (!title || !category || !description || !difficulty || !date) {
      return res.status(400).json({ message: 'Bitte alle Projektfelder ausfüllen.' });
    }

    const projects = await readProjects();
    const newProject = {
      id: cryptoRandomId(),
      title,
      category,
      description,
      difficulty,
      date
    };

    projects.unshift(newProject);
    await writeProjects(projects);

    return res.status(201).json(newProject);
  } catch (error) {
    return res.status(500).json({ message: 'Fehler beim Erstellen des Projekts.' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, difficulty, date } = req.body;

    const projects = await readProjects();
    const index = projects.findIndex((project) => project.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Projekt nicht gefunden.' });
    }

    projects[index] = {
      ...projects[index],
      title: title || projects[index].title,
      category: category || projects[index].category,
      description: description || projects[index].description,
      difficulty: difficulty || projects[index].difficulty,
      date: date || projects[index].date
    };

    await writeProjects(projects);
    return res.json(projects[index]);
  } catch (error) {
    return res.status(500).json({ message: 'Fehler beim Aktualisieren des Projekts.' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projects = await readProjects();
    const filtered = projects.filter((project) => project.id !== id);

    if (filtered.length === projects.length) {
      return res.status(404).json({ message: 'Projekt nicht gefunden.' });
    }

    await writeProjects(filtered);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Fehler beim Löschen des Projekts.' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Bitte eine Nachricht senden.' });
  }

  const hfApiKey = process.env.HF_API_KEY;

  if (!hfApiKey) {
    return res.json({
      reply: `KI ist im Demo-Modus 🤖\n\nDeine Frage: "${message}"\n\n` +
        'Für volle KI-Antworten hinterlege bitte die Umgebungsvariable HF_API_KEY.'
    });
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/google/flan-t5-large',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `Du bist ein MINT-Tutor. Erkläre verständlich für Schüler:innen: ${message}`
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HF API Fehler: ${response.status}`);
    }

    const data = await response.json();
    const reply = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;

    return res.json({
      reply: reply || 'Ich konnte gerade keine Antwort generieren. Versuche es erneut.'
    });
  } catch (error) {
    return res.json({
      reply: 'KI ist im Demo-Modus 🤖\nEs gab ein Problem mit der Hugging Face API. Bitte später erneut versuchen.'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, async () => {
  await ensureDataFile();
  console.log(`MINT Lab Server läuft auf http://localhost:${PORT}`);
});
