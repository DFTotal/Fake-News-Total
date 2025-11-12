import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UnifiedInput from '../components/UnifiedInput';
import AnalysisStats from '../components/AnalysisStats';
import MetricsSidebar from '../components/MetricsSidebar';
import ServicesStatus from '../components/ServicesStatus';
import { useMetrics } from '../utils/useMetricsStore.jsx';
import { 
  getApiHealth,
  getDatabaseHealth,
  getAIModelHealth,
  getWebExtractorHealth,
  API_CLASSIFICATIONS,
  registerUser,
  loginUser,
  checkFactsMulti,
  analyzeWithAllModels,
} from '../utils/api';


export default function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [systemHealth, setSystemHealth] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'login'
  const { addAnalysis } = useMetrics();

  // Verificar estado de la API al cargar
  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkApiStatus = async () => {
    try {
      const [health, dbHealth, aiHealth, webHealth] = await Promise.allSettled([
        getApiHealth(),
        getDatabaseHealth(),
        getAIModelHealth(),
        getWebExtractorHealth(),
      ]);
      
      const healthData = {
        api: health.status === 'fulfilled',
        database: dbHealth.status === 'fulfilled' && dbHealth.value?.status === 'healthy',
        ai_model: aiHealth.status === 'fulfilled' && aiHealth.value?.status === 'healthy',
        web_extractor: webHealth.status === 'fulfilled' && webHealth.value?.status === 'healthy',
      };
      
      setSystemHealth(healthData);
      
      // Si al menos la API principal está online, marcar como online
      if (healthData.api) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
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
    
    // ⏱️ INICIAR CONTADOR DE TIEMPO REAL
    const startTime = performance.now();

    try {
      let sourceLabel;
      let preview;
      let textContent = '';
      let urlContent = null;
      
      // Preparar labels y contenido según el tipo
      if (type === 'url') {
        sourceLabel = content;
        preview = content;
        urlContent = content;
        textContent = content; // Se extraerá en el análisis
      } else if (type === 'text') {
        sourceLabel = `Texto (${content.length} chars)`;
        preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
        textContent = content;
      } else if (type === 'file') {
        sourceLabel = `Archivo: ${content.name}`;
        preview = `${content.name} (${(content.size / 1024).toFixed(1)} KB)`;
      }

      console.log('🚀 Iniciando análisis con TODOS los modelos de IA...');

      // 1. ANALIZAR CON TODOS LOS MODELOS
      const multiModelResponse = await analyzeWithAllModels(content, type, type === 'file' ? content : null);
      
      // Extraer texto para fact-checking si vino del análisis
      if (multiModelResponse.extracted_text) {
        textContent = multiModelResponse.extracted_text;
      }

      console.log(`✅ Consenso de ${multiModelResponse.multi_model_analysis.total_models} modelos:`, 
                  `${multiModelResponse.prediction} (${Math.round(multiModelResponse.confidence * 100)}%)`);

      // 2. EJECUTAR FACT-CHECKING
      let factCheckResults = null;
      try {
        console.log('🔍 Consultando fact-checkers...');
        factCheckResults = await checkFactsMulti(textContent, urlContent);
        console.log('✅ Fact-checking completado');
      } catch (factError) {
        console.warn('⚠ Fact-checking no disponible:', factError);
      }

      // 3. COMBINAR: Consenso de IA + Fact-checking
      const aiPrediction = (multiModelResponse?.prediction || '').toLowerCase();
      const aiConfidence = multiModelResponse?.confidence || 0;
      const multiModelVotes = multiModelResponse.multi_model_analysis;
      
      let finalPrediction = aiPrediction;
      let finalConfidence = aiConfidence;
      let verificationSource = `Consenso de ${multiModelVotes.total_models} modelos de IA`;

      // PRIORIDAD 1: Si Google Fact Check tiene verificación
      if (factCheckResults?.results?.google?.success && factCheckResults.results.google.total_results > 0) {
        const googleClaims = factCheckResults.results.google.claims || [];
        
        if (googleClaims.length > 0) {
          const firstClaim = googleClaims[0];
          const rating = (firstClaim.textualRating || '').toLowerCase();
          
          // Interpretar rating de Google
          if (rating.includes('false') || rating.includes('falso') || rating.includes('incorrect')) {
            finalPrediction = 'fake';
            finalConfidence = 0.95; // Muy alta confianza con Google + IA
            verificationSource = 'Google Fact Check + IA';
          } else if (rating.includes('true') || rating.includes('correct') || rating.includes('verdadero')) {
            finalPrediction = 'real';
            finalConfidence = 0.95;
            verificationSource = 'Google Fact Check + IA';
          }
        }
      }
      
      // PRIORIDAD 2: Consenso de modelos muy fuerte (todos de acuerdo)
      else if (multiModelVotes.consensus_strength >= 0.8) {
        // 80% o más de los modelos están de acuerdo
        finalConfidence = Math.min(0.9, aiConfidence * 1.1); // Aumentar confianza ligeramente
        verificationSource = `Consenso fuerte: ${multiModelVotes.real_votes + multiModelVotes.fake_votes} de ${multiModelVotes.total_models} modelos`;
      }
      
      // PRIORIDAD 3: Consenso débil o dividido
      else if (multiModelVotes.consensus_strength < 0.6) {
        // Modelos muy divididos: reducir confianza
        finalConfidence = Math.max(0.3, aiConfidence * 0.8);
        verificationSource = `Opiniones divididas: ${multiModelVotes.real_votes} real vs ${multiModelVotes.fake_votes} fake`;
      }

      // PRECAUCIÓN: Si mayoría dice "uncertain", tratar como fake
      if (multiModelVotes.uncertain_votes > multiModelVotes.real_votes && 
          multiModelVotes.uncertain_votes > multiModelVotes.fake_votes) {
        finalPrediction = 'fake';
        finalConfidence = 0.4; // Baja confianza
        verificationSource = 'Modelos inciertos - Principio de precaución';
      }

      console.log('🎯 VEREDICTO FINAL:', finalPrediction.toUpperCase(), 
                  `(${Math.round(finalConfidence * 100)}% confianza)`);

      // ⏱️ CALCULAR TIEMPO REAL DE ANÁLISIS
      const endTime = performance.now();
      const realAnalysisTime = (endTime - startTime) / 1000; // Convertir a segundos

      // 4. RESULTADO FINAL ENRIQUECIDO (con tiempo real)
      const enrichedResponse = {
        ...multiModelResponse,
        prediction: finalPrediction,
        confidence: finalConfidence,
        verification_source: verificationSource,
        fact_check_results: factCheckResults,
        analysis_time: realAnalysisTime, // ✅ TIEMPO REAL
      };

      setResult(enrichedResponse);
      
      // Agregar análisis a las métricas
      addAnalysis({
        inputType: type,
        sourceLabel,
        result: finalPrediction === API_CLASSIFICATIONS.FAKE || finalPrediction === 'fake' ? 'fake' : 'real',
        score: (finalConfidence || 0) * 100,
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
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className={`w-2 h-2 rounded-full ${apiStatus==='online'?'bg-green-500':apiStatus==='offline'?'bg-rose-500':'bg-amber-500'}`}></span>
                <span className="font-medium text-slate-700">
                  {apiStatus === 'online' 
                    ? 'Sistema listo - 8 capas de verificación activas' 
                    : apiStatus === 'offline' 
                    ? 'Servicio temporalmente no disponible - Intenta más tarde' 
                    : 'Conectando con el servicio de verificación...'}
                </span>
              </div>
              {apiStatus === 'online' && systemHealth && (
                <div className="mt-2 text-xs text-slate-600">
                  {!systemHealth.database && ' • Base de datos en modo degradado'}
                  {!systemHealth.ai_model && ' • Algunos modelos de IA no disponibles'}
                  {!systemHealth.web_extractor && ' • Extractor web limitado'}
                  {systemHealth.database && systemHealth.ai_model && systemHealth.web_extractor && 
                    ' Todos los servicios operativos ✓'}
                </div>
              )}
            </div>
            <p className="text-center text-[13px] md:text-sm text-soft max-w-3xl mx-auto mt-5 leading-relaxed">
              Analiza URLs, texto o archivos con 6 modelos de IA simultáneamente para obtener un veredicto más preciso. Compartimos señales agregadas para fortalecer la comunidad.
            </p>
            <div className="flex flex-col lg:flex-row gap-10 mt-10">
              <div className="flex-1 min-w-0">
                <UnifiedInput onSubmit={handleSubmit} loading={loading} />
                {error && <div className="mt-4 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{error}</div>}
                <ServicesStatus />
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
