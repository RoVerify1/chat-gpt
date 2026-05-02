import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI } from '../api';

const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await projectAPI.getById(id);
      setProject(response.data.data);
      
      // Wenn Code existiert, parsen
      if (response.data.data.code) {
        try {
          const parsed = JSON.parse(response.data.data.code);
          setGeneratedData(parsed);
        } catch {
          setGeneratedData({ code: response.data.data.code, components: response.data.data.components || [], explanation: '' });
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Projekts:', error);
      alert('Projekt konnte nicht geladen werden');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setGenerating(true);
    try {
      const response = await projectAPI.generateCode(id, chatInput);
      setGeneratedData(response.data.data);
      setChatInput('');
      
      // Chat-Verlauf aktualisieren
      setProject(prev => ({
        ...prev,
        chatHistory: response.data.chatHistory
      }));
    } catch (error) {
      alert('Fehler bei der Code-Generierung: ' + (error.response?.data?.message || error.message));
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    if (generatedData?.code) {
      navigator.clipboard.writeText(generatedData.code);
      alert('Code in die Zwischenablage kopiert!');
    }
  };

  const downloadCode = () => {
    if (!generatedData?.code) return;
    
    const extension = project.board.includes('Arduino') ? '.ino' : '.py';
    const blob = new Blob([generatedData.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Lade Projekt...</div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary-600 hover:text-primary-700 mb-2"
          >
            ← Zurück zum Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.board}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat Interface */}
          <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">KI-Chat</h2>
              <p className="text-sm text-gray-600">Beschreibe was du bauen möchtest</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {project.chatHistory?.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>Starte einen Chat mit der KI</p>
                  <p className="text-sm mt-2">Beispiel: "Temperatursensor mit OLED Display"</p>
                </div>
              )}
              
              {project.chatHistory?.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-primary-100 ml-8' 
                      : 'bg-gray-100 mr-8'
                  }`}
                >
                  <p className="text-sm text-gray-800">{msg.content}</p>
                </div>
              ))}
              
              {generating && (
                <div className="bg-gray-100 mr-8 p-4 rounded-lg">
                  <p className="text-gray-600 loading-dots">KI generiert Code</p>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="px-6 py-4 border-t border-gray-200">
              <form onSubmit={handleGenerateCode} className="flex space-x-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Was möchtest du bauen?"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  disabled={generating}
                />
                <button
                  type="submit"
                  disabled={generating || !chatInput.trim()}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {generating ? '...' : 'Senden'}
                </button>
              </form>
            </div>
          </div>

          {/* Code & Components Display */}
          <div className="space-y-6">
            {/* Generated Code */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Generierter Code</h2>
                {generatedData?.code && (
                  <div className="flex space-x-2">
                    <button
                      onClick={copyCode}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
                    >
                      Kopieren
                    </button>
                    <button
                      onClick={downloadCode}
                      className="px-3 py-1 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded transition"
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6">
                {generatedData?.code ? (
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{generatedData.code}</code>
                  </pre>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>Noch kein Code generiert</p>
                    <p className="text-sm mt-2">Nutze den KI-Chat um Code zu erstellen</p>
                  </div>
                )}
              </div>
            </div>

            {/* Components List */}
            {generatedData?.components && generatedData.components.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Benötigte Komponenten</h2>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {generatedData.components.map((comp, idx) => (
                      <li key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-gray-800">{comp.name}</span>
                        <span className="text-sm text-gray-600">
                          Menge: {comp.quantity || 1}
                          {comp.notes && <span className="ml-2 text-gray-400">({comp.notes})</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Explanation */}
            {generatedData?.explanation && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Erklärung</h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700">{generatedData.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectView;
