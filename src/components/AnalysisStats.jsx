import React, { useState } from 'react';
import { getConfidenceLevel } from '../utils/api';

export default function AnalysisStats({ result }) {
  const [open, setOpen] = useState(false);
  if (!result) return null;

  const rawConfidence = result?.confidence || 0;
  const isReal = rawConfidence >= 0.5;
  const verdictLabel = isReal ? 'Real' : 'Falsa';
  const verdictColor = isReal ? '#22c55e' : '#ef4444';

  const bounded = Math.max(0, Math.min(1, rawConfidence));
  const displayConfidence = isReal ? bounded : (1 - bounded);
  const confidenceInfo = getConfidenceLevel(displayConfidence);

  return (
    <>
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full surface-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            {isReal ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={verdictColor} className="w-8 h-8"><path d="M2 21h4V9H2v12zm19.446-9.106A2 2 0 0 0 20 10h-5V4a2 2 0 0 0-2-2l-1 .5L9 9v12h8a3 3 0 0 0 2.846-1.96l2.6-7a2 2 0 0 0-.001-1.146z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={verdictColor} className="w-8 h-8 rotate-180"><path d="M2 3h4v12H2V3zm19.446 9.106A2 2 0 0 1 20 14h-5v6a2 2 0 0 1-2 2l-1-.5L9 15V3h8a3 3 0 0 1 2.846 1.96l2.6 7a2 2 0 0 1-.001 1.146z"/></svg>
            )}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold tracking-tight" style={{color: verdictColor}}>Veredicto: {verdictLabel}</span>
                <span className="text-sm text-soft">Confianza en veredicto</span>
                <span className="text-base font-semibold" style={{color: confidenceInfo.color}}>{Math.round(displayConfidence * 100)}%</span>
              </div>
              <div className="text-[13px] text-slate-600 mt-1">Revisa por qué dio este resultado</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div><span className="font-medium text-slate-700">Tiempo:</span> {result.analysis_time ? Number(result.analysis_time).toFixed(2)+'s' : 'N/A'}</div>
            <div className="hidden md:block h-5 w-px bg-slate-200" />
            <div><span className="font-medium text-slate-700">Contenido:</span> {(result.text_length || result.extracted_text_length || 0)} caracteres</div>
          </div>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
          />
          <div className="relative bg-white shadow-xl rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-800">{isReal ? '¿Por qué se considera real?' : '¿Por qué se considera falsa?'}</h3>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-700" aria-label="Cerrar">✕</button>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <div>
                <span className="font-medium">Predicción:</span> {verdictLabel}
              </div>
              <div>
                <span className="font-medium">Confianza en el veredicto:</span> {Math.round(displayConfidence * 100)}% ({confidenceInfo.label})
              </div>
              <div className="text-[12px] text-slate-500">Score del modelo (crudo): {Math.round(rawConfidence * 100)}%</div>
              {result.analysis_time != null && (
                <div>
                  <span className="font-medium">Tiempo de análisis:</span> {Number(result.analysis_time).toFixed(2)}s
                </div>
              )}
              <div>
                <span className="font-medium">Contenido analizado:</span> {(result.text_length || result.extracted_text_length || 0)} caracteres
              </div>
              
              {/* APIs Consultadas */}
              {result.used_apis && result.used_apis.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="font-medium text-blue-900 block mb-2">🔍 Fuentes consultadas:</span>
                  <div className="flex flex-wrap gap-2">
                    {result.used_apis.map((api, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                        {api}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview del contenido */}
              {result._preview && (
                <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 text-[12px] text-slate-700 max-h-40 overflow-auto whitespace-pre-wrap">
                  {result._preview}
                </div>
              )}

              {/* Metadata adicional si está disponible */}
              {(result.domain || result.source || result.reasoning) && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                  {result.domain && (
                    <div>
                      <span className="font-medium text-amber-900">Dominio:</span>
                      <span className="ml-2 text-amber-800">{result.domain}</span>
                    </div>
                  )}
                  {result.source && (
                    <div>
                      <span className="font-medium text-amber-900">Fuente:</span>
                      <span className="ml-2 text-amber-800">{result.source}</span>
                    </div>
                  )}
                  {result.reasoning && (
                    <div>
                      <span className="font-medium text-amber-900 block mb-1">Razonamiento:</span>
                      <p className="text-xs text-amber-800 whitespace-pre-wrap">{result.reasoning}</p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[13px] text-slate-600">
                Esta decisión combina señales del modelo de IA y verificaciones automáticas cuando están disponibles. Si no hay coincidencias directas en verificadores públicos, la confianza puede ser media o baja.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-md bg-slate-800 text-white hover:bg-slate-900">Entendido</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}