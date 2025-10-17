import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UnifiedInput from '../components/UnifiedInput';
import AnalysisStats from '../components/AnalysisStats';
import MetricsSidebar from '../components/MetricsSidebar';
import { useMetrics } from '../utils/useMetricsStore.jsx';
import { 
  analyzeText, 
  analyzeUrl, 
  analyzeFile,
  getApiHealth, 
  getConfidenceLevel,
  API_CLASSIFICATIONS,
  registerUser,
  loginUser,
} from '../utils/api';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'login'
  const { addAnalysis } = useMetrics();

  // Verificar estado de la API al cargar
  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      await getApiHealth();
      setApiStatus('online');
    } catch (err) {
      setApiStatus('offline');
      console.error('API no disponible:', err);
    }
  };

  const handleSubmit = async (content, type) => {
    if (!content) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response;
      let sourceLabel;
      let preview;
      
      if (type === 'url') {
        response = await analyzeUrl(content);
        sourceLabel = content;
        preview = content;
      } else if (type === 'text') {
        response = await analyzeText(content);
        sourceLabel = `Texto (${content.length} chars)`;
        preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
      } else if (type === 'file') {
        response = await analyzeFile(content);
        sourceLabel = `Archivo: ${content.name}`;
        preview = `${content.name} (${(content.size / 1024).toFixed(1)} KB)`;
      }

      setResult(response);
      
      // Agregar análisis a las métricas
      addAnalysis({
        inputType: type,
        sourceLabel,
        result: response.prediction === API_CLASSIFICATIONS.FAKE ? 'fake' : 'real',
        score: (response.confidence || 0) * 100,
        preview
      });
    } catch (err) {
      setError(err.message);
      console.error('Error analyzing:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenAuth={(mode = 'signup') => { setAuthMode(mode); setAuthOpen(true); }} />
      <div className="w-full">
        <div className="max-w-6xl mx-auto px-6">
          <div className="pt-6">
            <div className={`p-3 rounded-md text-xs md:text-sm text-center surface-card border ${apiStatus==='online'? 'border-green-200 bg-green-50' : apiStatus==='offline' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}> 
              <div className="flex items-center justify-center gap-2">
                <span className={`w-2 h-2 rounded-full ${apiStatus==='online'?'bg-green-500':'apiStatus'==='offline'?'bg-rose-500':'bg-amber-500'}`}></span>
                <span className="font-medium text-slate-700">
                  {apiStatus === 'online' ? 'Sistema listo para análisis' : apiStatus === 'offline' ? 'Servicio temporalmente no disponible' : 'Conectando con el servicio...'}
                </span>
              </div>
            </div>
            <p className="text-center text-[13px] md:text-sm text-soft max-w-3xl mx-auto mt-5 leading-relaxed">
              Analiza URLs, texto o archivos para clasificar contenido potencialmente falso. Compartimos señales agregadas para fortalecer la comunidad.
            </p>
            <div className="flex flex-col lg:flex-row gap-10 mt-10">
              <div className="flex-1 min-w-0">
                <UnifiedInput onSubmit={handleSubmit} loading={loading} />
                {loading && <div className="mt-6 text-center text-xs text-soft">Procesando…</div>}
                {error && <div className="mt-4 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{error}</div>}
                <AnalysisStats result={result} />
              </div>
              <MetricsSidebar />
            </div>
          </div>
        </div>
      </div>
      {authOpen && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthOpen(false)}
          onToggleMode={() => setAuthMode(m => (m === 'signup' ? 'login' : 'signup'))}
        />)
      }
    </div>
  );
}

function AuthModal({ mode, onClose, onToggleMode }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lastSubmitAtRef = React.useRef(0);
  const THROTTLE_MS = 2000; // 2s entre envíos
  const REGISTER_COOLDOWN_MS = 60000; // 60s por email
  const [cooldownSecs, setCooldownSecs] = useState(0);
  const now = () => Date.now();
  const key = (t,e) => `${t}Cooldown:${(e||'').trim().toLowerCase()}`;
  const left = (t,e,w) => {
    try { const ts = parseInt(localStorage.getItem(key(t,e))||'0',10)||0; const d = now()-ts; return d<w? (w-d):0; } catch { return 0; }
  };
  const mark = (t,e) => { try { localStorage.setItem(key(t,e), String(now())); } catch {} };
  const severe = (err) => {
    const m = (err?.message || '').toLowerCase();
    return m.includes('failed to fetch') || m.startsWith('http 5') || m.includes('internal server error') || m.includes('network');
  };

  useEffect(() => {
    if (mode === 'login') { setCooldownSecs(0); return; }
    const tick = () => setCooldownSecs(Math.ceil(left('reg', email, REGISTER_COOLDOWN_MS)/1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [mode, email]);

  async function handleSubmit(e){
    e.preventDefault();
    setError('');
    // throttle global
    const since = now() - lastSubmitAtRef.current;
    if (since < THROTTLE_MS) {
      setError('Por favor espera un momento antes de intentar nuevamente.');
      return;
    }
    // cooldown por email para registro
    if (mode !== 'login') {
      const remain = left('reg', email, REGISTER_COOLDOWN_MS);
      if (remain > 0) {
        const secs = Math.ceil(remain/1000);
        setError(`Demasiados intentos con este correo. Intenta nuevamente en ${secs}s.`);
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await loginUser(email, password);
        localStorage.setItem('access_token', result.access_token);
        onClose();
      } else {
        await registerUser(email, password);
        mark('reg', email);
        onToggleMode();
      }
    } catch (err) {
      if (mode !== 'login' && severe(err)) setError('No se pudo registrar. Inténtalo más tarde.');
      else setError(err.message || 'Error de autenticación');
    } finally { setLoading(false); }
    lastSubmitAtRef.current = now();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white shadow-xl rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700" aria-label="Cerrar">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700">Email</label>
            <input id="auth-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input id="auth-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button type="submit" disabled={loading || (mode !== 'login' && cooldownSecs>0)} className={`w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition ${(loading || (mode !== 'login' && cooldownSecs>0)) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {(() => {
              if (loading) return 'Procesando...';
              if (mode === 'login') return 'Entrar';
              return cooldownSecs>0 ? `Espera ${cooldownSecs}s` : 'Registrarse';
            })()}
          </button>
          {mode !== 'login' && cooldownSecs>0 && (
            <div className="mt-2 text-center text-xs text-slate-600">Cooldown activo para este correo. Intenta nuevamente en {cooldownSecs}s.</div>
          )}
        </form>
        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? (
            <button onClick={onToggleMode} className="text-blue-600 hover:underline" disabled={loading}>¿No tienes cuenta? Regístrate</button>
          ) : (
            <button onClick={onToggleMode} className="text-blue-600 hover:underline" disabled={loading}>¿Ya tienes cuenta? Inicia sesión</button>
          )}
        </div>
      </div>
    </div>
  );
}
