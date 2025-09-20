import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UnifiedInput from '../components/UnifiedInput';
import AnalysisStats from '../components/AnalysisStats';
import MetricsSidebar from '../components/MetricsSidebar';
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="w-full">
        <div className="max-w-6xl mx-auto px-6">
          <div className="pt-6">
            <div className={`p-3 rounded-md text-xs md:text-sm text-center surface-card border ${apiStatus==='online'? 'border-green-200 bg-green-50' : apiStatus==='offline' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}> 
              <div className="flex items-center justify-center gap-2">
                <span className={`w-2 h-2 rounded-full ${apiStatus==='online'?'bg-green-500':'apiStatus'==='offline'?'bg-rose-500':'bg-amber-500'}`}></span>
                <span className="font-medium text-slate-700">
                  {apiStatus === 'online' ? 'Sistema listo para análisis' : apiStatus === 'offline' ? 'Servicio temporalmente no disponible' : 'Conectando con el servicio...'}
                </span>
              </div>
            </div>
            <p className="text-center text-[13px] md:text-sm text-soft max-w-3xl mx-auto mt-5 leading-relaxed">
              Analiza URLs, texto o archivos para clasificar contenido potencialmente falso. Compartimos señales agregadas para fortalecer la comunidad.
            </p>
            <div className="flex flex-col lg:flex-row gap-10 mt-10">
              <div className="flex-1 min-w-0">
                <UnifiedInput onSubmit={handleSubmit} loading={loading} />
                {loading && <div className="mt-6 text-center text-xs text-soft">Procesando…</div>}
                {error && <div className="mt-4 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{error}</div>}
                <AnalysisStats result={result} />
              </div>
              <MetricsSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
