const api = {
  async getProjects(category = 'Alle') {
    const query = category === 'Alle' ? '' : `?category=${encodeURIComponent(category)}`;
    const response = await fetch(`/api/projects${query}`);
    return response.json();
  },
  async createProject(payload) {
    const response = await fetch('/api/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    return response.json();
  },
  async updateProject(id, payload) {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    return response.json();
  },
  async deleteProject(id) {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  },
  async chat(message) {
    const response = await fetch('/api/ai/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message })
    });
    return response.json();
  }
};

const facts = [
  'Der ESP32 hat integriertes WLAN und Bluetooth.',
  'Python wurde 1991 veröffentlicht.',
  'Ein Micro:bit hat Sensoren für Licht und Bewegung.',
  'Robotik verbindet Mechanik, Elektronik und Software.',
  'Naturwissenschaften nutzen Experimente zur Überprüfung von Hypothesen.'
];

const projectForm = document.getElementById('projectForm');
const projectList = document.getElementById('projectList');
const filterCategory = document.getElementById('filterCategory');
const cancelEditBtn = document.getElementById('cancelEdit');
const submitBtn = document.getElementById('submitBtn');

function randomFact() {
  document.getElementById('factText').textContent = facts[Math.floor(Math.random() * facts.length)];
}

function projectTemplate(project) {
  return `
    <article class="project-item">
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <p class="project-meta">${project.category} · ${project.difficulty} · ${project.date}</p>
      <div class="project-actions">
        <button class="secondary" data-edit="${project.id}">Bearbeiten</button>
        <button data-delete="${project.id}">Löschen</button>
      </div>
    </article>`;
}

async function renderProjects() {
  const projects = await api.getProjects(filterCategory.value);
  projectList.innerHTML = projects.length ? projects.map(projectTemplate).join('') : '<p>Keine Projekte gefunden.</p>';
}

function getFormData() {
  return {
    title: document.getElementById('title').value.trim(),
    category: document.getElementById('category').value,
    description: document.getElementById('description').value.trim(),
    difficulty: document.getElementById('difficulty').value,
    date: document.getElementById('date').value
  };
}

function resetForm() {
  projectForm.reset();
  document.getElementById('projectId').value = '';
  cancelEditBtn.classList.add('hidden');
  submitBtn.textContent = 'Projekt speichern';
}

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.getElementById('projectId').value;
  const payload = getFormData();

  if (id) {
    await api.updateProject(id, payload);
  } else {
    await api.createProject(payload);
  }

  resetForm();
  await renderProjects();
});

projectList.addEventListener('click', async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (deleteId) {
    await api.deleteProject(deleteId);
    await renderProjects();
  }

  if (editId) {
    const projects = await api.getProjects('Alle');
    const project = projects.find((entry) => entry.id === editId);
    if (!project) return;

    document.getElementById('projectId').value = project.id;
    document.getElementById('title').value = project.title;
    document.getElementById('category').value = project.category;
    document.getElementById('description').value = project.description;
    document.getElementById('difficulty').value = project.difficulty;
    document.getElementById('date').value = project.date;
    cancelEditBtn.classList.remove('hidden');
    submitBtn.textContent = 'Projekt aktualisieren';
  }
});

cancelEditBtn.addEventListener('click', resetForm);
filterCategory.addEventListener('change', renderProjects);

const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');

function addMessage(role, text) {
  const message = document.createElement('div');
  message.className = `msg ${role}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatToggle.addEventListener('click', () => chatWindow.classList.toggle('hidden'));
closeChat.addEventListener('click', () => chatWindow.classList.add('hidden'));

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  addMessage('user', text);
  input.value = '';
  addMessage('bot', 'Denke nach …');

  const data = await api.chat(text);
  chatMessages.lastChild.remove();
  addMessage('bot', data.reply || 'Keine Antwort erhalten.');
});

randomFact();
setInterval(randomFact, 8000);
renderProjects();
addMessage('bot', 'Hi! Ich bin dein MINT-KI-Assistent. Frag mich alles zu Informatik, Robotik oder Naturwissenschaften.');
