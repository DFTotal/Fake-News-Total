import React from 'react';
import { useMetrics } from '../utils/useMetricsStore.jsx';

export default function MetricsSidebar() {
  const { stats, analyses } = useMetrics();
  const recent = analyses.slice(0,5);
  return (
    <aside className="w-full md:w-80 xl:w-96 flex-shrink-0 space-y-8" aria-label="Resumen de métricas">
      {/* Header del sidebar */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-bold">Panel de Control</h3>
        </div>
        <p className="text-slate-300 text-sm">Estadísticas en tiempo real</p>
      </div>
      
      <KPICards stats={stats} />
      <RecentList recent={recent} />
    </aside>
  );
}

function KPICards({ stats }) {
  const pct = stats.fakePct || 0;
  const circleSize = 54;
  const stroke = 6;
  const radius = (circleSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const cards = [
    {
      id: 'total',
      label: 'Total',
      value: stats.total,
      accent: 'from-slate-600 to-slate-500',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white"><path fill="currentColor" d="M3 5h18v2H3V5m0 6h18v2H3v-2m0 6h18v2H3v-2"/></svg>
      )
    },
    {
      id: 'fake',
      label: 'Falsas',
      value: stats.fake,
      accent: 'from-rose-600 to-rose-500',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white"><path fill="currentColor" d="M12 2L1 21h22L12 2m0 3.84L19.53 19H4.47L12 5.84M11 10v5h2v-5h-2m0 6v2h2v-2h-2Z"/></svg>
      )
    },
    {
      id: 'real',
      label: 'Reales',
      value: stats.real,
      accent: 'from-emerald-600 to-emerald-500',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41"/></svg>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {cards.map(c => (
          <div key={c.id} className="relative group rounded-2xl p-5 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-200/50 overflow-hidden transform hover:scale-105">
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${c.accent}`}/>
            <div className="relative flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs tracking-wider uppercase text-slate-500 font-bold mb-2">{c.label}</span>
                <span className="text-4xl font-black text-slate-800 tabular-nums">{c.value}</span>
                <div className={`w-16 h-1.5 rounded-full mt-3 bg-gradient-to-r ${c.accent}`}></div>
              </div>
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${c.accent} shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300`}>
                {c.icon}
              </div>
            </div>
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br opacity-5 rounded-full blur-2xl from-slate-400 to-slate-600"></div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 rounded-xl p-4 bg-white shadow-sm border border-slate-100">
        <div className="relative" style={{ width: circleSize, height: circleSize }}>
          <svg width={circleSize} height={circleSize}>
            <circle cx={circleSize/2} cy={circleSize/2} r={radius} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
            <circle
              cx={circleSize/2}
              cy={circleSize/2}
              r={radius}
              stroke="#6366f1"
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">{pct.toFixed(0)}%</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 leading-snug">Porcentaje de noticias clasificadas como falsas sobre el total analizado.</p>
          <MiniTrend />
        </div>
      </div>
    </div>
  );
}

function MiniTrend() {
  // Placeholder simple (podría reemplazarse por sparkline real)
  // Usamos caracteres blocks con degradado
  const bars = Array.from({ length: 8 }, () => Math.random());
  return (
    <div className="mt-2 flex items-end gap-0.5 h-6" aria-hidden="true">
      {bars.map((b,i) => (
        <div key={i} className="w-1.5 rounded-t bg-indigo-500/60" style={{ height: (20 + b*80) + '%' }} />
      ))}
    </div>
  );
}

function RecentList({ recent }) {
  return (
    <div className="bg-white border border-slate-100 rounded-md p-4 shadow-sm">
      <h3 className="text-sm font-medium text-slate-600 mb-2">Últimos</h3>
      {recent.length === 0 && <p className="text-xs text-slate-400">Sin datos todavía.</p>}
      <ul className="space-y-2 max-h-72 overflow-y-auto">
        {recent.map(r => (
          <li key={r.id} className="text-[11px] flex flex-col border-b last:border-b-0 pb-2 last:pb-0 border-slate-100">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700 truncate max-w-[150px]" title={r.sourceLabel}>{r.sourceLabel}</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold text-white ${r.result === 'fake' ? 'bg-rose-600' : 'bg-emerald-600'}`}>{r.result.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-[9px] mt-1 text-slate-500">
              <span>{r.inputType}</span>
              <span>{r.score}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
