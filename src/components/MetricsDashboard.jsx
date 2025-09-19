import React from 'react';
import { useMetrics } from '../utils/useMetricsStore.jsx';

export default function MetricsDashboard() {
  const { analyses, stats } = useMetrics();
  return (
  <div className="max-w-6xl mx-auto py-6" aria-live="polite">
      <h2 className="text-2xl font-semibold text-slate-700 mb-6">Estadísticas</h2>
      <KPICards stats={stats} />
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <Trend days={stats.days} />
        <TypeDistribution byType={stats.byType} />
        <RecentList analyses={analyses} />
      </div>
    </div>
  );
}

function KPICards({ stats }) {
  const items = [
    { label: 'Total Analizadas', value: stats.total, color: 'bg-slate-600' },
    { label: 'Falsas', value: stats.fake, color: 'bg-rose-600' },
    { label: 'Reales', value: stats.real, color: 'bg-emerald-600' },
    { label: '% Falsas', value: stats.fakePct.toFixed(1) + '%', color: 'bg-indigo-600' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(it => (
        <div key={it.label} className="rounded-lg p-4 bg-white shadow flex flex-col border border-slate-100">
          <span className="text-xs uppercase tracking-wide text-slate-500">{it.label}</span>
          <span className={`mt-2 text-2xl font-semibold text-white px-3 py-2 rounded-md inline-block ${it.color}`}>{it.value}</span>
        </div>
      ))}
    </div>
  );
}

function Trend({ days }) {
  return (
  <div className="bg-white rounded-lg shadow p-4 flex flex-col border border-slate-100">
      <h3 className="font-medium text-slate-600 mb-2">Tendencia 7 días</h3>
      <div className="flex-1 flex items-end space-x-2 h-40">
        {days.map(d => {
          const max = Math.max(...days.map(x => x.total), 1);
            const h = max ? (d.total / max) * 100 : 0;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-slate-200 rounded-sm overflow-hidden" style={{ height: '100%' }}>
                  <div className="bg-slate-500 w-full transition-all" style={{ height: h + '%' }} />
                </div>
                <span className="mt-1 text-[10px] text-slate-500">{d.day.slice(5)}</span>
              </div>
            );
        })}
      </div>
      <div className="mt-2 flex justify-center gap-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500" /> Total</div>
      </div>
    </div>
  );
}

function TypeDistribution({ byType }) {
  const entries = ['url','text','file'].map(t => ({ type: t, value: byType[t] || 0 }));
  const max = Math.max(...entries.map(e => e.value), 1);
  return (
  <div className="bg-white rounded-lg shadow p-4 border border-slate-100">
      <h3 className="font-medium text-slate-600 mb-4">Distribución por Tipo</h3>
      <ul className="space-y-3">
        {entries.map(e => (
          <li key={e.type} className="flex flex-col">
            <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{e.type.toUpperCase()}</span><span>{e.value}</span></div>
            <div className="h-3 rounded bg-slate-200 overflow-hidden">
              <div className="h-full bg-brand-600" style={{ width: (e.value / max * 100) + '%' }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecentList({ analyses }) {
  const list = analyses.slice(0, 8);
  return (
  <div className="bg-white rounded-lg shadow p-4 flex flex-col border border-slate-100">
      <h3 className="font-medium text-slate-600 mb-2">Últimos Análisis</h3>
      {list.length === 0 && <p className="text-xs text-slate-400">Sin datos todavía.</p>}
      <ul className="flex-1 divide-y divide-slate-200 overflow-y-auto">
        {list.map(a => (
          <li key={a.id} className="py-2 text-xs flex flex-col">
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">{a.sourceLabel}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${a.result === 'fake' ? 'bg-rose-600' : 'bg-emerald-600'}`}>{a.result.toUpperCase()}</span>
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-slate-500">
              <span>{a.inputType}</span>
              <span>{a.score}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
