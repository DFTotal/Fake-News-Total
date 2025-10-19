import React, { useState, useRef, useEffect } from 'react';
// Helpers de cooldown/rate a nivel de módulo
const nowTs = () => Date.now();
const getCooldownKey = (type, email) => `${type}Cooldown:${(email || '').trim().toLowerCase()}`;
const getCooldownLeftMs = (type, email, windowMs) => {
  try {
    const ts = Number.parseInt(localStorage.getItem(getCooldownKey(type, email)) || '0', 10) || 0;
    return Math.max(0, windowMs - (nowTs() - ts));
  } catch { return 0; }
};
const setCooldownTs = (type, email) => {
  try { localStorage.setItem(getCooldownKey(type, email), String(nowTs())); } catch {}
};
const isSevereError = (err) => {
  const m = (err?.message || '').toLowerCase();
  return m.includes('failed to fetch') || m.startsWith('http 5') || m.includes('internal server error') || m.includes('network');
};
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../utils/api';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const lastSubmitAtRef = useRef(0);
  const navigate = useNavigate();

  const THROTTLE_MS = 2000; // 2s entre envíos
  const REGISTER_COOLDOWN_MS = 60000; // 60s por email
  const LOGIN_FAIL_COOLDOWN_MS = 15000; // 15s por email tras fallo de login
  const [cooldownSecs, setCooldownSecs] = useState(0);

  // Actualizar UI del cooldown según modo (registro/login)
  useEffect(() => {
    let timer;
    const tick = () => {
      const leftMs = isLogin
        ? getCooldownLeftMs('login', email, LOGIN_FAIL_COOLDOWN_MS)
        : getCooldownLeftMs('reg', email, REGISTER_COOLDOWN_MS);
      setCooldownSecs(Math.ceil(leftMs/1000));
    };
    tick();
    timer = setInterval(tick, 1000);
    return () => { clearInterval(timer); };
  }, [isLogin, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Evitar doble/triple submit si ya hay una petición en curso
    if (loading) return;
    // Throttle global ligero
    const now = nowTs();
    const since = now - lastSubmitAtRef.current;
    if (since < THROTTLE_MS) {
      setError('Por favor espera un momento antes de intentar nuevamente.');
      return;
    }
    // Bloquear inmediatamente nuevos envíos dentro de la ventana de throttle
    lastSubmitAtRef.current = now;

    // Cooldown por email para registro
    if (!isLogin) {
      const leftMs = getCooldownLeftMs('reg', email, REGISTER_COOLDOWN_MS);
      if (leftMs > 0) {
        const secs = Math.ceil(leftMs/1000);
        setError(`Demasiados intentos con este correo. Intenta nuevamente en ${secs}s.`);
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const result = await loginUser(email, password);
        localStorage.setItem('access_token', result.access_token);
        setLoading(false);
        navigate('/');
      } else {
        await registerUser(email, password);
        // establecer cooldown solo tras registro exitoso
        setCooldownTs('reg', email);
        setLoading(false);
        alert('Registro exitoso. Ahora puedes iniciar sesión.');
        setIsLogin(true);
      }
    } catch (err) {
        setLoading(false);
        const msg = (err?.message || '').toLowerCase();
        // Caso específico: correo ya registrado
        if (!isLogin && msg.includes('email already registered')) {
          setError('El correo ya está registrado. Inicia sesión o usa otro correo.');
          // Cambiar automáticamente a la vista de login para evitar reintentos innecesarios
          setIsLogin(true);
          return;
        }
        // Tras fallo de login, activar cooldown corto por email
        if (isLogin) {
          setCooldownTs('login', email);
        }
        if (!isLogin && isSevereError(err)) {
          setError('No se pudo registrar. Inténtalo más tarde.');
        } else {
          setError(err.message || 'Error de autenticación');
        }
    }
    finally {
      // Mantener actualizado el timestamp del último submit (opcional)
      lastSubmitAtRef.current = nowTs();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className={`w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition ${(loading || (!isLogin && cooldownSecs>0)) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading || (!isLogin && cooldownSecs>0)}
          >
            {(() => {
              if (loading) return 'Procesando...';
              if (isLogin) return 'Entrar';
              return cooldownSecs>0 ? `Espera ${cooldownSecs}s` : 'Registrarse';
            })()}
          </button>
          {!isLogin && cooldownSecs>0 && (
            <p className="mt-2 text-center text-xs text-slate-600">Cooldown activo para este correo. Intenta nuevamente en {cooldownSecs}s.</p>
          )}
        </form>
        <div className="mt-6 text-center">
          {isLogin ? (
            <span>
              ¿No tienes cuenta?{' '}
              <button
                className="text-blue-600 hover:underline font-medium"
                onClick={() => setIsLogin(false)}
                disabled={loading}
              >
                Regístrate
              </button>
            </span>
          ) : (
            <span>
              ¿Ya tienes cuenta?{' '}
              <button
                className="text-blue-600 hover:underline font-medium"
                onClick={() => setIsLogin(true)}
                disabled={loading}
              >
                Inicia sesión
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;