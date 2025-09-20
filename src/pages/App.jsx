import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UnifiedInput from '../components/UnifiedInput';
import AnalysisStats from '../components/AnalysisStats';
import MetricsSidebar from '../components/MetricsSidebar';
import ApiTester from '../components/ApiTester';
import { useMetrics } from '../utils/useMetricsStore.jsx';
import { 
  analyzeText, 
  analyzeUrl, 
  analyzeFile,
  getApiHealth, 
  getConfidenceLevel,
  API_CLASSIFICATIONS 
} from '../utils/api';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const { addAnalysis } = useMetrics();

  // Verificar estado de la API al cargar
  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      await getApiHealth();
      setApiStatus('online');
    } catch (err) {
      setApiStatus('offline');
      console.error('API no disponible:', err);
    }
  };

  const handleSubmit = async (content, type) => {
    if (!content) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;
      let sourceLabel;
      let preview;
      
      if (type === 'url') {
        response = await analyzeUrl(content);
        sourceLabel = content;
        preview = content;
      } else if (type === 'text') {
        response = await analyzeText(content);
        sourceLabel = `Texto (${content.length} chars)`;
        preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
      } else if (type === 'file') {
        response = await analyzeFile(content);
        sourceLabel = `Archivo: ${content.name}`;
        preview = `${content.name} (${(content.size / 1024).toFixed(1)} KB)`;
      }

      setResult(response);
      
      // Agregar análisis a las métricas
      addAnalysis({
        inputType: type,
        sourceLabel,
        result: response.prediction === API_CLASSIFICATIONS.FAKE ? 'fake' : 'real',
        score: (response.confidence || 0) * 100,
        preview
      });
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
      
      {/* Indicador de estado de la API */}
      <div className="px-6 md:px-16 pt-4">
        <div className={`max-w-2xl mx-auto p-3 rounded-lg text-sm text-center ${
          apiStatus === 'online' ? 'bg-green-100 text-green-800' :
          apiStatus === 'offline' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {apiStatus === 'online' ? '🟢 La app está lista' :
           apiStatus === 'offline' ? '🔴 No está disponible' :
           '🟡 Espere por favor...'}
        </div>
      </div>

      <main className="flex-1 px-6 md:px-16">
        <p className="text-center text-sm md:text-base text-slate-600 max-w-4xl mx-auto mt-4">
          Analice archivos, Textos, y URL sospechosos para detectar Noticias Falsas y otras infracciones y compártalos automáticamente con la comunidad de seguridad.
        </p>
        
        {/* Layout con sidebar de métricas */}
        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          {/* Contenido principal */}
          <div className="flex-1">
            <UnifiedInput 
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
          <div className="max-w-2xl mx-auto mt-6 p-6 bg-white rounded-lg shadow-lg border">
            <h3 className="text-xl font-bold mb-6 text-center">📊 Resultados del Análisis</h3>
            
            {/* Clasificación principal */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
                result.prediction === API_CLASSIFICATIONS.FAKE ? 'bg-red-100 text-red-800' :
                result.prediction === API_CLASSIFICATIONS.REAL ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {result.prediction === API_CLASSIFICATIONS.FAKE ? '🚨 Fake News Detectada' :
                 result.prediction === API_CLASSIFICATIONS.REAL ? '✅ Noticia Legítima' :
                 '⚠️ Resultado Incierto'}
              </div>
            </div>

            {/* Medidor de confianza mejorado */}
            {result.confidence !== undefined && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Nivel de Confianza:</span>
                  <span className={`font-bold`} style={{ 
                    color: getConfidenceLevel(result.confidence).color 
                  }}>
                    {getConfidenceLevel(result.confidence).label} ({(result.confidence * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${result.confidence * 100}%`,
                      backgroundColor: getConfidenceLevel(result.confidence).color
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {result.confidence >= 0.8 ? 'Resultado muy confiable' :
                   result.confidence >= 0.6 ? 'Resultado confiable' :
                   result.confidence >= 0.4 ? 'Resultado moderadamente confiable' :
                   'Resultado poco confiable - Se recomienda verificación manual'}
                </p>
              </div>
            )}

            {/* Información adicional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t">
              {result.text_length && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Texto analizado:</span>
                  <span className="ml-2">{result.text_length} caracteres</span>
                </div>
              )}
              
              {result.analysis_time && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Tiempo de análisis:</span>
                  <span className="ml-2">{result.analysis_time.toFixed(2)}s</span>
                </div>
              )}

              {result.source_url && (
                <div className="text-sm md:col-span-2">
                  <span className="font-medium text-gray-700">URL analizada:</span>
                  <a 
                    href={result.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 break-all"
                  >
                    {result.source_url}
                  </a>
                </div>
              )}

              {result.extracted_text_length && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Texto extraído:</span>
                  <span className="ml-2">{result.extracted_text_length} caracteres</span>
                </div>
              )}
            </div>

            {/* Mostrar datos técnicos en un acordeón */}
            <details className="mt-4 pt-4 border-t">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                Ver datos técnicos del análisis
              </summary>
              <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                <pre className="whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

            {/* Estadísticas rápidas del análisis */}
            <AnalysisStats result={result} />

            {/* Tester de API (temporal para desarrollo) */}
            <ApiTester />
          </div>

          {/* Sidebar de métricas */}
          <MetricsSidebar />
        </div>
      </main>
    </div>
  );
}
