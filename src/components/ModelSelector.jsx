import React, { useState, useEffect } from 'react';
import { getAvailableModels, getCurrentModel, changeModel } from '../utils/api';

export default function ModelSelector() {
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const [modelsData, currentData] = await Promise.all([
        getAvailableModels(),
        getCurrentModel()
      ]);
      setModels(modelsData.available_models || []);
      setCurrentModel(currentData.current_model);
    } catch (error) {
      console.error('Error cargando modelos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = async (modelId) => {
    setChanging(true);
    try {
      await changeModel(modelId);
      setCurrentModel(modelId);
      setIsOpen(false);
      // Notificar que el modelo cambió
      globalThis.dispatchEvent(new CustomEvent('modelChanged', { detail: { modelId } }));
    } catch (error) {
      console.error('Error cambiando modelo:', error);
      alert('No se pudo cambiar el modelo. Intenta de nuevo.');
    } finally {
      setChanging(false);
    }
  };

  const getCurrentModelInfo = () => {
    return models.find(m => m.model_id === currentModel);
  };

  const currentInfo = getCurrentModelInfo();

  if (loading) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="surface-card p-3 rounded-lg flex items-center gap-2 text-sm hover:shadow-md transition-shadow w-full"
        disabled={changing}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <div className="flex-1 text-left">
          <div className="font-medium text-slate-700">
            {currentInfo?.name || 'Modelo de IA'}
          </div>
          <div className="text-[10px] text-slate-500">
            {currentInfo?.language || 'Unknown'} • {currentInfo?.accuracy || 'N/A'}
          </div>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 right-0 z-50 surface-card rounded-lg shadow-xl max-h-96 overflow-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-slate-600 px-3 py-2">
                Selecciona un modelo de IA ({models.length} disponibles)
              </div>
              {models.map((model) => {
                const isActive = model.model_id === currentModel;
                return (
                  <button
                    key={model.model_id}
                    onClick={() => handleModelChange(model.model_id)}
                    disabled={changing || isActive}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-purple-50 border border-purple-200' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-slate-700 flex items-center gap-2">
                          {model.name}
                          {isActive && (
                            <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full">
                              Activo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {model.description}
                        </div>
                        <div className="flex gap-3 mt-1.5 text-[10px]">
                          <span className="text-blue-600">📍 {model.language}</span>
                          <span className="text-green-600">✓ {model.accuracy}</span>
                          <span className="text-amber-600">⚡ {model.speed}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-slate-200 p-3 bg-slate-50 text-[11px] text-slate-600">
              💡 <strong>Tip:</strong> Para español, usa modelos "Spanish" o "BETO". Para inglés, usa "RoBERTa" o "BERT".
            </div>
          </div>
        </>
      )}
    </div>
  );
}
