import React from 'react';
import { getConfidenceLevel } from '../utils/api';

export default function AnalysisStats({ result }) {
  if (!result) return null;

  const confidenceInfo = getConfidenceLevel(result.confidence || 0);
  
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Tarjeta de Confianza */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-center">
          <div 
            className="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: confidenceInfo.color }}
          >
            {Math.round(confidenceInfo.score * 100)}%
          </div>
          <h4 className="font-semibold text-sm">Confianza</h4>
          <p className="text-xs text-gray-600">{confidenceInfo.label}</p>
        </div>
      </div>

      {/* Tarjeta de Velocidad */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
            ⚡
          </div>
          <h4 className="font-semibold text-sm">Tiempo</h4>
          <p className="text-xs text-gray-600">
            {result.analysis_time ? `${result.analysis_time.toFixed(2)}s` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Tarjeta de Contenido */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-500 flex items-center justify-center text-white font-bold text-lg">
            📄
          </div>
          <h4 className="font-semibold text-sm">Contenido</h4>
          <p className="text-xs text-gray-600">
            {result.text_length || result.extracted_text_length || 0} chars
          </p>
        </div>
      </div>
    </div>
  );
}