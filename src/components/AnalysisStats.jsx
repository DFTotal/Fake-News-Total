import React, { useState } from 'react';
import { getConfidenceLevel } from '../utils/api';

export default function AnalysisStats({ result }) {
  const [open, setOpen] = useState(false);
  if (!result) return null;

  const rawConfidence = result?.confidence || 0;
  const prediction = (result?.prediction || '').toLowerCase();
  const textLength = result?.text_length || result?.extracted_text_length || 0;
  
  // 🛡️ ADVERTENCIA: Texto muy corto
  const isTooShort = textLength < 100;
  const isCriticallyShort = textLength < 50;
  
  // Determinar si es real o falso basándose en la respuesta del backend
  // Aplicamos principio de precaución: si hay duda, tratarlo como falso
  let isReal;
  
  if (prediction === 'fake' || prediction === 'false') {
    isReal = false;
  } else if (prediction === 'real' || prediction === 'true') {
    isReal = true;
  } else if (prediction === 'uncertain') {
    // PRINCIPIO DE PRECAUCIÓN: Si el modelo no puede clasificar con certeza,
    // es más seguro tratarlo como potencialmente falso
    // La gente debe verificar por su cuenta antes de compartir
    isReal = false;
  } else {
    // Sin prediction claro, usar umbral del 50%
    isReal = rawConfidence >= 0.5;
  }
  
  const verdictLabel = isReal ? 'Real' : 'Falsa';
  const verdictColor = isReal ? '#22c55e' : '#ef4444';

  const bounded = Math.max(0, Math.min(1, rawConfidence));
  // Mostrar la confianza tal como viene del backend
  // Representa qué tan seguro está el modelo del veredicto
  const displayConfidence = bounded;
  const confidenceInfo = getConfidenceLevel(displayConfidence);

  return (
    <>
      {/* ⚠️ ADVERTENCIA DE TEXTO CORTO */}
      {isTooShort && (
        <div className={`mt-4 p-3 rounded-lg border-2 ${
          isCriticallyShort 
            ? 'bg-rose-50 border-rose-300' 
            : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="flex items-start gap-2">
            <span className="text-xl">{isCriticallyShort ? '🚨' : '⚠️'}</span>
            <div className="flex-1 text-sm">
              <div className={`font-semibold mb-1 ${
                isCriticallyShort ? 'text-rose-700' : 'text-amber-700'
              }`}>
                {isCriticallyShort ? 'Advertencia Crítica' : 'Advertencia'}
              </div>
              <div className={isCriticallyShort ? 'text-rose-600' : 'text-amber-700'}>
                El texto analizado es muy corto ({textLength} caracteres). 
                Los modelos de IA necesitan más contexto para un análisis confiable.
                <strong className="block mt-1">
                  {isCriticallyShort 
                    ? '⚠️ Confiabilidad muy baja - Verifica manualmente antes de compartir'
                    : '⚠️ Confiabilidad reducida - Se recomienda verificar con fuentes adicionales'
                  }
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full surface-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left rounded-lg hover:shadow-md transition-shadow border border-slate-200"
        >
          <div className="flex items-start gap-4 flex-1">
            {isReal ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={verdictColor} className="w-10 h-10 flex-shrink-0"><path d="M2 21h4V9H2v12zm19.446-9.106A2 2 0 0 0 20 10h-5V4a2 2 0 0 0-2-2l-1 .5L9 9v12h8a3 3 0 0 0 2.846-1.96l2.6-7a2 2 0 0 0-.001-1.146z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={verdictColor} className="w-10 h-10 flex-shrink-0 rotate-180"><path d="M2 3h4v12H2V3zm19.446 9.106A2 2 0 0 1 20 14h-5v6a2 2 0 0 1-2 2l-1-.5L9 15V3h8a3 3 0 0 1 2.846 1.96l2.6 7a2 2 0 0 1-.001 1.146z"/></svg>
            )}
            <div className="flex-1">
              <div className="text-xl font-bold mb-1" style={{color: verdictColor}}>Veredicto: {verdictLabel}</div>
              <div className="text-sm text-slate-600">
                <span className="font-medium">Confianza:</span> <span className="font-semibold" style={{color: confidenceInfo.color}}>{Math.round(displayConfidence * 100)}%</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-slate-600 md:items-end md:min-w-[200px]">
            <div><span className="text-slate-500">Tiempo:</span> <span className="font-medium">{result.analysis_time ? Number(result.analysis_time).toFixed(2)+'s' : 'N/A'}</span></div>
            <div><span className="text-slate-500">Contenido:</span> <span className="font-medium">{(result.text_length || result.extracted_text_length || 0)} caracteres</span></div>
            {result.multi_model_analysis && (
              <div><span className="text-slate-500">Modelos:</span> <span className="font-medium">{result.multi_model_analysis.total_models}</span></div>
            )}
          </div>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
          />
          <div className="relative bg-white shadow-xl rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">Detalles del análisis</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl w-8 h-8 flex items-center justify-center" aria-label="Cerrar">✕</button>
            </div>
            <div className="space-y-5 text-sm text-slate-700">
              {/* Resumen principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded border border-slate-200">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Predicción</div>
                  <div className="text-lg font-bold" style={{color: verdictColor}}>{verdictLabel}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Confianza</div>
                  <div className="text-lg font-bold" style={{color: confidenceInfo.color}}>{Math.round(displayConfidence * 100)}%</div>
                </div>
              </div>

              {result.verification_source && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="font-medium text-slate-700">Fuente de verificación:</span>
                  <span className="ml-2 text-slate-600">{result.verification_source}</span>
                </div>
              )}
              
              {/* Análisis Multi-Modelo */}
              {result.multi_model_analysis && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-semibold text-slate-800">Modelos consultados ({result.multi_model_analysis.total_models})</h4>
                  </div>
                  
                  {/* Lista de modelos consultados - Grid de 2 columnas */}
                  {result.multi_model_analysis.individual_results && result.multi_model_analysis.individual_results.length > 0 && (
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {result.multi_model_analysis.individual_results.map((modelResult, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-800 text-sm truncate" title={modelResult.model_id}>
                                {modelResult.model_id}
                              </div>
                              <div className="text-slate-500 text-xs mt-0.5">
                                {modelResult.language} • {modelResult.accuracy}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                modelResult.prediction === 'real' 
                                  ? 'bg-green-100 text-green-700' 
                                  : modelResult.prediction === 'fake'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {modelResult.prediction.toUpperCase()}
                              </span>
                              <span className="text-xs text-slate-600">
                                {Math.round(modelResult.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Resumen del consenso */}
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center text-xs">
                      <div>
                        <div className="text-slate-500 mb-1">Total</div>
                        <div className="font-semibold text-slate-800">{result.multi_model_analysis.total_models}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Real</div>
                        <div className="font-semibold text-green-600">{result.multi_model_analysis.real_votes}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Falso</div>
                        <div className="font-semibold text-red-600">{result.multi_model_analysis.fake_votes}</div>
                      </div>
                      {result.multi_model_analysis.uncertain_votes > 0 && (
                        <div>
                          <div className="text-slate-500 mb-1">Incierto</div>
                          <div className="font-semibold text-amber-600">{result.multi_model_analysis.uncertain_votes}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-slate-500 mb-1">Consenso</div>
                        <div className="font-semibold text-slate-800">{Math.round(result.multi_model_analysis.consensus_strength * 100)}%</div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Promedio</div>
                        <div className="font-semibold text-slate-800">{Math.round(result.multi_model_analysis.average_confidence * 100)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Nueva sección: Google Fact Check Integration */}
              {result.fact_check && (result.fact_check.claims_found > 0 || result.fact_check.score_adjustment !== 0) && (
                <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
                  <div className="px-4 py-3 bg-blue-100 border-b border-blue-200">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      {result.fact_check.claims_found > 0 
                        ? `Verificación Externa (${result.fact_check.claims_found} fuentes)`
                        : 'Verificación Inteligente'}
                    </h4>
                  </div>
                  <div className="p-4">
                    {result.fact_check.score_adjustment !== 0 && (
                      <div className={`mb-3 p-3 rounded border ${
                        result.fact_check.score_adjustment < 0 
                          ? 'bg-red-50 border-red-200 text-red-800' 
                          : 'bg-green-50 border-green-200 text-green-800'
                      }`}>
                        <div className="font-medium text-sm mb-1 flex items-center gap-2">
                          {result.fact_check.score_adjustment < 0 ? (
                            <>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Alerta: Contenido sospechoso
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verificación positiva
                            </>
                          )}
                        </div>
                        <div className="text-xs">
                          {result.fact_check.score_adjustment < -0.3 
                            ? '🚨 Detección de inconsistencia temporal o contenido verificado como falso'
                            : result.fact_check.score_adjustment < 0
                            ? `Ajuste aplicado: ${(result.fact_check.score_adjustment * 100).toFixed(0)}%`
                            : `Contenido verificado positivamente (+${(result.fact_check.score_adjustment * 100).toFixed(0)}%)`
                          }
                        </div>
                      </div>
                    )}
                    
                    {result.fact_check.data?.claims && result.fact_check.data.claims.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-blue-800 mb-2">
                          Fuentes de verificación externa:
                        </div>
                        {result.fact_check.data.claims.slice(0, 3).map((claim, idx) => (
                          <div key={idx} className="p-3 bg-white rounded border border-blue-200">
                            <div className="font-medium text-blue-900 text-sm mb-1">
                              {claim.text || claim.claim || 'Sin descripción'}
                            </div>
                            {claim.claimant && (
                              <div className="text-xs text-blue-700 mb-1">
                                Afirmado por: {claim.claimant}
                              </div>
                            )}
                            {claim.claimReview && claim.claimReview[0] && (
                              <div className="mt-2 pt-2 border-t border-blue-100">
                                <div className="text-xs text-blue-700">
                                  <strong>Rating:</strong> {claim.claimReview[0].textualRating || 'N/A'}
                                </div>
                                {claim.claimReview[0].publisher?.name && (
                                  <div className="text-xs text-blue-600 mt-0.5">
                                    Verificado por: {claim.claimReview[0].publisher.name}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {result.fact_check.claims_found === 0 && result.fact_check.score_adjustment < 0 && (
                      <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                        ⚠️ Detección automática de inconsistencias (verificación temporal, patrones sospechosos, etc.)
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Resultados de Fact-Checking */}
              {result.fact_check_results && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h4 className="font-semibold text-slate-800">Verificación de hechos</h4>
                  </div>
                  
                  {/* Google Fact Check */}
                  {result.fact_check_results.results?.google?.success && (
                    <div className="p-4 border-b border-slate-200">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-slate-700">Google Fact Check</span>
                        <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                          {result.fact_check_results.results.google.total_results} resultado(s)
                        </span>
                      </div>
                      {result.fact_check_results.results.google.claims && result.fact_check_results.results.google.claims.length > 0 ? (
                        <div className="space-y-2">
                          {result.fact_check_results.results.google.claims.slice(0, 2).map((claim, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                              <div className="font-medium text-slate-800 text-sm mb-1">{claim.text || 'Sin descripción'}</div>
                              {claim.claimant && (
                                <div className="text-xs text-slate-600">Por: {claim.claimant}</div>
                              )}
                              {claim.textualRating && (
                                <div className="font-medium text-slate-700 mt-1 text-xs">
                                  Rating: {claim.textualRating}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">No se encontraron verificaciones</div>
                      )}
                    </div>
                  )}

                  {/* RapidAPI */}
                  {result.fact_check_results.results?.rapidapi?.success && (
                    <div className="p-4 border-b border-slate-200">
                      <span className="text-sm font-medium text-slate-700">RapidAPI Fact Check</span>
                      <div className="text-sm text-slate-600 mt-1">Verificación exitosa</div>
                    </div>
                  )}

                  {/* Resumen */}
                  {result.fact_check_results.summary && (
                    <div className="px-4 py-3 bg-slate-50 text-xs text-slate-600">
                      <div>APIs: {result.fact_check_results.summary.apis_called?.join(', ') || 'N/A'}</div>
                      <div>Exitosas: {result.fact_check_results.summary.successful_calls || 0} / {result.fact_check_results.summary.total_apis_used || 0}</div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Información adicional */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {result.analysis_time != null && (
                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <div className="text-slate-500 mb-1">Tiempo</div>
                    <div className="font-semibold text-slate-800">{Number(result.analysis_time).toFixed(2)}s</div>
                  </div>
                )}
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="text-slate-500 mb-1">Caracteres</div>
                  <div className="font-semibold text-slate-800">{(result.text_length || result.extracted_text_length || 0).toLocaleString()}</div>
                </div>
              </div>
              
              {/* Preview del contenido */}
              {result._preview && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="font-medium text-slate-700 mb-2 text-xs">Vista previa</div>
                  <div className="text-xs text-slate-600 max-h-40 overflow-auto whitespace-pre-wrap">
                    {result._preview}
                  </div>
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

              <p className="text-[13px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                <strong>Cómo funciona:</strong> Analizamos con {result.multi_model_analysis?.total_models || 'múltiples'} modelos de IA especializados en detección de fake news. 
                {result.fact_check?.claims_found > 0 && ' Además, verificamos con Google Fact Check para contrastar con verificaciones externas reales.'}
                {' '}El veredicto final se basa en el consenso de los modelos{result.fact_check?.score_adjustment !== 0 ? ' ajustado por fact-checking' : ''}.
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