import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, updateProject, generateCode } from '../api';

function ProjectView({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadProject();
  }, [id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [project?.chatHistory]);

  const loadProject = async () => {
    try {
      const data = await getProject(id);
      setProject(data);
      if (data.code) {
        try {
          setGeneratedData(JSON.parse(data.code));
        } catch (e) {
          setGeneratedData({ code: data.code, components: data.components || [], explanation: data.description || '' });
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Projekts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setGenerating(true);
    try {
      const data = await generateCode(id, chatInput);
      setGeneratedData({
        code: data.code,
        components: data.components,
        explanation: data.explanation
      });
      setProject(prev => ({ ...prev, chatHistory: data.chatHistory }));
      setChatInput('');
    } catch (error) {
      console.error('Fehler bei der Code-Generierung:', error);
      alert('Fehler bei der Code-Generierung. Bitte versuche es erneut.');
    } finally {
      setGenerating(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (generatedData?.code) {
      navigator.clipboard.writeText(generatedData.code);
      alert('Code in die Zwischenablage kopiert!');
    }
  };

  const downloadCode = () => {
    if (!generatedData?.code) return;
    
    const extension = project.board.includes('Pico') ? '.py' : '.ino';
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Projekt...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Projekt nicht gefunden</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Zurück
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-1">
                {project.board}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
          >
            Abmelden
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chat Interface */}
          <div className="bg-white rounded-lg shadow-md flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">KI-Assistent</h2>
              <p className="text-sm text-gray-600">Beschreibe, was du bauen möchtest</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {project.chatHistory?.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>Stelle deine erste Frage an den KI-Assistenten</p>
                  <p className="text-sm mt-2">z.B. "Temperatursensor mit OLED Display"</p>
                </div>
              )}
              
              {project.chatHistory?.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <p className="text-sm">Code generiert! ✓</p>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleGenerateCode} className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Was möchtest du bauen?"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={generating}
                />
                <button
                  type="submit"
                  disabled={generating || !chatInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition duration-200"
                >
                  {generating ? '...' : 'Senden'}
                </button>
              </div>
            </form>
          </div>

          {/* Code Display */}
          <div className="bg-white rounded-lg shadow-md flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Generierter Code</h2>
                {generatedData?.explanation && (
                  <p className="text-sm text-gray-600 mt-1">{generatedData.explanation}</p>
                )}
              </div>
              {generatedData?.code && (
                <div className="flex space-x-2">
                  <button
                    onClick={copyCodeToClipboard}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg text-sm transition duration-200"
                  >
                    Kopieren
                  </button>
                  <button
                    onClick={downloadCode}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition duration-200"
                  >
                    Download
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!generatedData?.code ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Der generierte Code erscheint hier</p>
                </div>
              ) : (
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono h-full">
                  <code>{generatedData.code}</code>
                </pre>
              )}
            </div>

            {/* Components List */}
            {generatedData?.components && generatedData.components.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Benötigte Komponenten:</h3>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {generatedData.components.map((component, index) => (
                    <li key={index}>{component}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectView;
