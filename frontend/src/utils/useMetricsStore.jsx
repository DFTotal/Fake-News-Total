import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

// Estructura de un análisis registrado
// {
//   id: string,
//   createdAt: Date,
//   inputType: 'url' | 'text' | 'file',
//   sourceLabel: string,
//   result: 'fake' | 'real',
//   score: number (0-100),
//   preview: string,
// }

const MetricsContext = createContext(null);

export function MetricsProvider({ children }) {
  const idCounter = useRef(0);
  const [analyses, setAnalyses] = useState(() => []);

  function addAnalysis(partial) {
    idCounter.current += 1;
    const score = typeof partial.score === 'number' ? partial.score : generateScore();
    const result = score > 55 ? 'fake' : 'real';
    const entry = {
      id: String(idCounter.current),
      createdAt: new Date(),
      inputType: partial.inputType,
      sourceLabel: partial.sourceLabel,
      preview: partial.preview?.slice(0, 120) || '',
      score,
      result,
    };
    setAnalyses(a => [entry, ...a]);
    return entry;
  }

  function generateScore() {
    return Math.round(Math.pow(Math.random(), 0.8) * 100);
  }

  const stats = useMemo(() => {
    const total = analyses.length;
    const fake = analyses.filter(a => a.result === 'fake').length;
    const real = total - fake;
    const fakePct = total ? (fake / total) * 100 : 0;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setHours(0,0,0,0);
      day.setDate(day.getDate() - i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23,59,59,999);
      const items = analyses.filter(a => a.createdAt >= day && a.createdAt <= dayEnd);
      days.push({
        day: day.toISOString().slice(0,10),
        total: items.length,
        fake: items.filter(a => a.result === 'fake').length,
        real: items.filter(a => a.result === 'real').length,
      });
    }

    const byType = analyses.reduce((acc, a) => {
      acc[a.inputType] = (acc[a.inputType] || 0) + 1;
      return acc;
    }, {});

    return { total, fake, real, fakePct, days, byType };
  }, [analyses]);

  const value = useMemo(() => ({ analyses, addAnalysis, stats }), [analyses, stats]);
  return <MetricsContext.Provider value={value}>{children}</MetricsContext.Provider>;
}

export function useMetrics() {
  const ctx = useContext(MetricsContext);
  if (!ctx) throw new Error('useMetrics debe usarse dentro de <MetricsProvider>');
  return ctx;
}
