import React, { useState, useEffect } from 'react';

export default function ServicesStatus() {
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    checkServices();
    // Verificar cada 5 minutos
    const interval = setInterval(checkServices, 300000);
    return () => clearInterval(interval);
  }, []);

  const checkServices = async () => {
    try {
      const baseUrl = '/api'; // Usar proxy en producción
      const response = await fetch(`${baseUrl}/health/verification-layers`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error checking services:', error);
      // Si falla, mostrar estado degradado
      setServices({
        status: 'degraded',
        active_components: 0,
        total_components: 6,
        availability_percentage: 0,
        components: {
          ner_service: false,
          wikipedia_api: false,
          news_api: false,
          political_detector: false,
          ai_analyzer: false,
          web_extractor: false
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !services) return null;

  const { status, active_components, total_components, availability_percentage, components } = services;

  const statusColor = status === 'healthy' ? 'green' : status === 'degraded' ? 'amber' : 'red';
  const statusBg = status === 'healthy' ? 'bg-green-50' : status === 'degraded' ? 'bg-amber-50' : 'bg-red-50';
  const statusBorder = status === 'healthy' ? 'border-green-200' : status === 'degraded' ? 'border-amber-200' : 'border-red-200';
  const statusText = status === 'healthy' ? 'text-green-700' : status === 'degraded' ? 'text-amber-700' : 'text-red-700';

  const serviceLabels = {
    ner_service: 'NER + Entity Database',
    wikipedia_api: 'Wikipedia/Wikidata',
    news_api: 'NewsAPI',
    political_detector: 'Political Claims Detector',
    ai_analyzer: 'AI Sentiment Analysis',
    web_extractor: 'Web Content Extraction'
  };

  return (
    <div className={`mt-4 p-3 rounded-lg border ${statusBorder} ${statusBg}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full bg-${statusColor}-500`}></div>
          <span className={`text-sm font-medium ${statusText}`}>
            Sistema de Verificación: {active_components}/{total_components} servicios activos ({availability_percentage}%)
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-4 h-4 ${statusText} transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
          {Object.entries(components || {}).map(([key, isActive]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{serviceLabels[key] || key}</span>
              <div className="flex items-center gap-2">
                {isActive ? (
                  <>
                    <span className="text-green-600 font-medium">Activo</span>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </>
                ) : (
                  <>
                    <span className="text-amber-600 font-medium">No disponible</span>
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  </>
                )}
              </div>
            </div>
          ))}
          <div className="mt-3 pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-600">
              {status === 'healthy' && '✅ Todos los servicios funcionando correctamente.'}
              {status === 'degraded' && '⚠️ Algunos servicios no disponibles. El sistema seguirá funcionando con los servicios activos.'}
              {status === 'unhealthy' && '❌ Varios servicios no disponibles. La precisión puede verse afectada.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
