import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Tabs from '../components/Tabs';
import UploadArea from '../components/UploadArea';
import { analyzeText, analyzeUrl } from '../utils/api';

export default function App() {
  const [mode, setMode] = useState('url');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!value) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;
      
      if (mode === 'url') {
        response = await analyzeUrl(value);
      } else if (mode === 'text') {
        response = await analyzeText(value);
      } else if (mode === 'file') {
        // Por ahora mostrar que archivo no está soportado
        throw new Error('El análisis de archivos aún no está implementado');
      }

      setResult(response);
    } catch (err) {
      setError(err.message);
      console.error('Error analyzing:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-200 text-slate-800">
      <Navbar />
      <main className="flex-1 px-6 md:px-16">
        <p className="text-center text-sm md:text-base text-slate-600 max-w-2xl mx-auto mt-4">
          Analice archivos, Textos, y URL sospechosos para detectar Noticias Falsas y otras infracciones y compártalos automáticamente con la comunidad de seguridad.
        </p>
        <Tabs current={mode} onChange={(m) => { setMode(m); setValue(''); setResult(null); setError(null); }} />
        <UploadArea 
          mode={mode} 
          value={value} 
          onChange={setValue} 
          onSubmit={handleSubmit}
          loading={loading}
        />
        
        {/* Mostrar resultados */}
        {loading && (
          <div className="max-w-xl mx-auto mt-6 p-4 bg-blue-100 rounded-lg">
            <p className="text-center text-blue-800">🔍 Analizando contenido...</p>
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto mt-6 p-4 bg-red-100 rounded-lg">
            <p className="text-center text-red-800">❌ Error: {error}</p>
          </div>
        )}

        {result && (
          <div className="max-w-xl mx-auto mt-6 p-6 bg-white rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center">📊 Resultados del Análisis</h3>
            
            {result.prediction !== undefined && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Probabilidad de Fake News:</span>
                  <span className={`font-bold ${result.prediction > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                    {(result.prediction * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${result.prediction > 0.5 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${result.prediction * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {result.classification && (
              <div className="mb-4">
                <span className="font-medium">Clasificación: </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  result.classification === 'fake' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {result.classification === 'fake' ? '🚨 Fake News' : '✅ Noticia Real'}
                </span>
              </div>
            )}

            <div className="text-sm text-gray-600">
              <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
