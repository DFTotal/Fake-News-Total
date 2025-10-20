import React, { useState, useEffect } from 'react';
import { useMetrics } from '../utils/useMetricsStore.jsx';
import { getApiMetrics, getFactCheckStatus } from '../utils/api';

export default function MetricsSidebar() {
  const { stats, analyses } = useMetrics();
  const [globalStats, setGlobalStats] = useState(null);
  const [factCheckStatus, setFactCheckStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const recent = analyses.slice(0,5);

  useEffect(() => {
    let mounted = true;
    async function fetchGlobalStats() {
      try {
        const data = await getApiMetrics();
        if (mounted) {
          setGlobalStats(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching global metrics:', err);
        if (mounted) setLoading(false);
      }
    }
    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 30000); // Actualizar cada 30s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchFactCheckStatus() {
      try {
        const data = await getFactCheckStatus();
        if (mounted) {
          setFactCheckStatus(data);
        }
      } catch (err) {
        console.error('Error fetching fact-check status:', err);
      }
    }
    fetchFactCheckStatus();
    const interval = setInterval(fetchFactCheckStatus, 60000); // Actualizar cada 60s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="w-full md:w-72 xl:w-80 flex-shrink-0 space-y-6" aria-label="Resumen de métricas">
      <div className="surface-card p-4 flex flex-col gap-0.5">
        <span className="text-[10px] font-medium tracking-wide text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"/> Online</span>
        <h3 className="text-sm font-semibold text-slate-700">Panel de Control</h3>
        <p className="text-[11px] text-soft">Estadísticas en tiempo real</p>
      </div>
      <FactCheckAPIs factCheckStatus={factCheckStatus} />
      <KPICards stats={stats} globalStats={globalStats} loading={loading} />
      <RecentList recent={recent} />
    </aside>
  );
}

function FactCheckAPIs({ factCheckStatus }) {
  if (!factCheckStatus) return null;

  // Mapeo de nombres técnicos a nombres amigables
  const apiNames = {
    google_fact_check: 'Google Fact Check',
    rapidapi: 'RapidAPI',
    claimbuster: 'ClaimBuster',
    newsapi: 'NewsAPI',
    mediacloud: 'Media Cloud',
  };

  // Obtener todas las APIs disponibles
  const configuredApis = factCheckStatus.configured_apis || [];
  const activeCount = configuredApis.filter(api => factCheckStatus[api]).length;

  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-700">APIs de Verificación</h4>
        <span className="text-[10px] font-medium text-emerald-600">
          {activeCount}/{configuredApis.length} activas
        </span>
      </div>
      <div className="space-y-2">
        {configuredApis.map(apiKey => {
          const isActive = factCheckStatus[apiKey];
          return (
            <div key={apiKey} className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{apiNames[apiKey] || apiKey}</span>
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {isActive ? 'Activa' : 'Inactiva'}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      {configuredApis.length === 0 && (
        <p className="text-[11px] text-soft">No hay APIs configuradas</p>
      )}
    </div>
  );
}

function KPICards({ stats, globalStats, loading }) {
  // Sección de métricas locales (tu sesión)
  const localCards = [
    { id:'total', label:'Tu sesión', value: stats.total, sub: 'análisis' },
    { id:'fake', label:'Falsas', value: stats.fake, sub: 'detectadas' },
    { id:'real', label:'Reales', value: stats.real, sub: 'verificadas' }
  ];

  // Sección de métricas globales (comunidad)
  const globalCards = globalStats ? [
    { id:'g-total', label:'Comunidad', value: globalStats.total_analyses || 0, sub: 'total' },
    { id:'g-fake', label:'Falsas', value: globalStats.fake_count || 0, sub: `${(globalStats.fake_percentage || 0).toFixed(1)}%` },
    { id:'g-real', label:'Reales', value: globalStats.real_count || 0, sub: `${(globalStats.real_percentage || 0).toFixed(1)}%` }
  ] : null;

  return (
    <div className="grid gap-3">
      {/* Métricas locales */}
      <div className="surface-card p-3">
        <h4 className="text-[10px] font-medium text-slate-600 mb-2 tracking-wide uppercase">Tu sesión</h4>
        <div className="grid gap-2">
          {localCards.map(c => (
            <div key={c.id} className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">{c.label}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-semibold text-slate-700">{c.value}</span>
                <span className="text-[10px] text-soft">{c.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas globales */}
      {loading ? (
        <div className="surface-card p-4 flex items-center justify-center">
          <span className="text-[11px] text-soft">Cargando estadísticas...</span>
        </div>
      ) : globalCards ? (
        <div className="surface-card p-3">
          <h4 className="text-[10px] font-medium text-slate-600 mb-2 tracking-wide uppercase">Comunidad</h4>
          <div className="grid gap-2">
            {globalCards.map(c => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">{c.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-semibold text-slate-700">{c.value}</span>
                  <span className="text-[10px] text-soft">{c.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <FakePct value={stats.fakePct} label="Tu sesión" />
    </div>
  );
}

function FakePct({ value, label }) {
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
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wide">{label || 'Análisis'}</span>
        <p className="text-[11px] leading-snug text-soft">% clasificadas como falsas</p>
      </div>
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
