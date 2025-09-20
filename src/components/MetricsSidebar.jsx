import React from 'react';
import { useMetrics } from '../utils/useMetricsStore.jsx';

export default function MetricsSidebar() {
  const { stats, analyses } = useMetrics();
  const recent = analyses.slice(0,5);
  return (
    <aside className="w-full md:w-72 xl:w-80 flex-shrink-0 space-y-6" aria-label="Resumen de métricas">
      <div className="surface-card p-4 flex flex-col gap-0.5">
        <span className="text-[10px] font-medium tracking-wide text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/> Online</span>
        <h3 className="text-sm font-semibold text-slate-700">Panel de Control</h3>
        <p className="text-[11px] text-soft">Estadísticas en tiempo real</p>
      </div>
      <KPICards stats={stats} />
      <RecentList recent={recent} />
    </aside>
  );
}

function KPICards({ stats }) {
  const cards = [
    { id:'total', label:'Total', value: stats.total },
    { id:'fake', label:'Falsas', value: stats.fake },
    { id:'real', label:'Reales', value: stats.real }
  ];
  return (
    <div className="grid gap-3">
      {cards.map(c => (
        <div key={c.id} className="surface-card p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="card-title">{c.label}</span>
            <span className="metric-value text-slate-700">{c.value}</span>
          </div>
        </div>
      ))}
      <FakePct value={stats.fakePct} />
    </div>
  );
}

function FakePct({ value }) {
  const pct = value || 0;
  return (
    <div className="surface-card p-4 flex items-center gap-4">
      <div className="relative w-12 h-12">
        <svg width={48} height={48}>
          <circle cx={24} cy={24} r={20} stroke="#e2e8f0" strokeWidth={4} fill="none" />
          <circle cx={24} cy={24} r={20} stroke="#3b63f3" strokeWidth={4} fill="none" strokeDasharray={2*Math.PI*20} strokeDashoffset={(1-pct/100)*(2*Math.PI*20)} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-slate-700">{pct.toFixed(0)}%</span>
      </div>
      <p className="text-[11px] leading-snug text-soft">% de noticias clasificadas como falsas del total.</p>
    </div>
  );
}

function RecentList({ recent }) {
  return (
    <div className="surface-card p-4 flex flex-col">
      <h4 className="card-title mb-2">Recientes</h4>
      {recent.length === 0 && <p className="text-[11px] text-soft">Sin datos.</p>}
      <ul className="divide-y divide-gray-200/70 max-h-72 overflow-y-auto">
        {recent.map(r => (
          <li key={r.id} className="py-2 text-[11px] flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="font-medium text-slate-700 truncate max-w-[120px]" title={r.sourceLabel}>{r.sourceLabel}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${r.result === 'fake' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{r.result.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-[10px] text-soft">
              <span>{r.inputType}</span>
              <span>{r.score}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
