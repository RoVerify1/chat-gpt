import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../api';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', board: 'ESP32-S3', description: '' });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const boards = ['ESP32-S3', 'ESP32', 'Arduino Uno', 'Arduino Nano', 'Raspberry Pi Pico', 'STM32', 'Other'];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.data);
    } catch (error) {
      console.error('Fehler beim Laden der Projekte:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.create(newProject);
      setShowNewProjectModal(false);
      setNewProject({ name: '', board: 'ESP32-S3', description: '' });
      loadProjects();
    } catch (error) {
      alert('Fehler beim Erstellen des Projekts: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm('Möchtest du dieses Projekt wirklich löschen?')) return;
    
    try {
      await projectAPI.delete(id);
      loadProjects();
    } catch (error) {
      alert('Fehler beim Löschen des Projekts');
    }
  };

  const getBoardColor = (board) => {
    const colors = {
      'ESP32-S3': 'bg-purple-100 text-purple-800',
      'ESP32': 'bg-blue-100 text-blue-800',
      'Arduino Uno': 'bg-green-100 text-green-800',
      'Arduino Nano': 'bg-teal-100 text-teal-800',
      'Raspberry Pi Pico': 'bg-red-100 text-red-800',
      'STM32': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[board] || colors['Other'];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Lade Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Embedded AI Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Hallo, {user?.username}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Gesamtprojekte</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{projects.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Verfügbare Boards</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{boards.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">KI-Status</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">Aktiv</p>
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Meine Projekte</h2>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              + Neues Projekt
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <p className="text-lg">Noch keine Projekte vorhanden</p>
              <p className="mt-2">Erstelle dein erstes Projekt mit KI-Unterstützung!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {projects.map((project) => (
                <div key={project._id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-800">{project.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBoardColor(project.board)}`}>
                          {project.board}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-gray-600 mt-1 text-sm">{project.description}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-2">
                        Zuletzt aktualisiert: {new Date(project.updatedAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/project/${project._id}`)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm"
                      >
                        Öffnen
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project._id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Neues Projekt erstellen</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Projektname</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Mein tolles Projekt"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Board auswählen</label>
                <select
                  value={newProject.board}
                  onChange={(e) => setNewProject({ ...newProject, board: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {boards.map((board) => (
                    <option key={board} value={board}>{board}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung (optional)</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Kurze Beschreibung des Projekts..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
