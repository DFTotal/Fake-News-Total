import React from 'react';
import { getConfidenceLevel } from '../utils/api';

export default function AnalysisStats({ result }) {
  if (!result) return null;
  const confidenceInfo = getConfidenceLevel(result.confidence || 0);
  const items = [
    { label: 'Confianza', value: Math.round(confidenceInfo.score * 100) + '%', sub: confidenceInfo.label, color: confidenceInfo.color },
    { label: 'Tiempo', value: result.analysis_time ? result.analysis_time.toFixed(2)+'s' : 'N/A', sub: 'Procesamiento', color: '#3b63f3' },
    { label: 'Contenido', value: (result.text_length || result.extracted_text_length || 0), sub: 'caracteres', color: '#64748b' }
  ];
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map(it => (
        <div key={it.label} className="surface-card p-4 flex flex-col gap-2">
          <span className="card-title">{it.label}</span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-semibold tracking-tight text-slate-700" style={{color: it.color}}>{it.value}</span>
            <span className="text-[11px] text-soft mb-1">{it.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}