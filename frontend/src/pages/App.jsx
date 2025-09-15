import React, { useState } from 'react';
import Navbar from '../components/Navbar';
// Legacy components Tabs & UploadArea se mantienen por referencia pero no se usan.
import SmartAnalyzer from '../components/SmartAnalyzer.jsx';
import MetricsSidebar from '../components/MetricsSidebar.jsx';
import { useMetrics } from '../utils/useMetricsStore.jsx';

export default function App() {
  const [lastType, setLastType] = useState(null);
  const { addAnalysis } = useMetrics();

  const handleSmartSubmit = ({ type, value, fileName, backend }) => {
    const base = {
      inputType: type,
      sourceLabel: type === 'file' ? (fileName || 'Archivo') : (type === 'url' ? value : 'Texto'),
      preview: type === 'file' ? fileName : value,
    };
    if (backend) {
      // usar score backend (0-1) -> escalar 0-100
      const created = addAnalysis({
        ...base,
        score: Math.round((backend.score ?? 0) * 100),
      });
      alert(`(API) ${created.inputType} => ${created.result.toUpperCase()} (${created.score})`);
    } else {
      const created = addAnalysis(base);
      alert(`(LOCAL) ${created.inputType} => ${created.result.toUpperCase()} (${created.score})`);
    }
    setLastType(type);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-200 text-slate-800">
      <Navbar />
      <main className="flex-1 px-6 md:px-16">
        <p className="text-center text-sm md:text-base text-slate-600 max-w-2xl mx-auto mt-4">
          Analice archivos, Textos, y URL sospechosos para detectar Noticias Falsas y otras infracciones y compártalos automáticamente con la comunidad de seguridad.
        </p>
        <div className="flex flex-col md:flex-row md:items-start gap-10 mt-6">
          <div className="flex-1 min-w-0 space-y-4">
            <SmartAnalyzer onSubmit={handleSmartSubmit} />
            {lastType && (
              <p className="text-xs text-slate-500">Último tipo detectado: <span className="font-medium">{lastType}</span></p>
            )}
          </div>
          <MetricsSidebar />
        </div>
      </main>
    </div>
  );
}
