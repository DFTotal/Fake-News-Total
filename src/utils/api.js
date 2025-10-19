/**
 * Fake News Detection API Client
 * Basado en la API de detección de noticias falsas https://fakenewsignacio.vercel.app
 */

// En producción (Vercel), usar proxy /api para evitar CORS mediante rewrites; en dev usar URL directa
const API_BASE_URL = (typeof globalThis !== 'undefined' && globalThis.location && String(globalThis.location.hostname || '').endsWith('vercel.app'))
  ? '/api'
  : 'https://fakenewsignacio.vercel.app';

// Configuración por defecto para las peticiones
const defaultRequestConfig = {
  headers: {
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 segundos de timeout (informativo)
};

function getAuthToken() {
  try {
    return localStorage.getItem('access_token') || null;
  } catch { return null; }
}

function withAuthHeaders(additional = {}) {
  const token = getAuthToken();
  if (token) return { ...additional, Authorization: `Bearer ${token}` };
  return additional;
}

/**
 * Función auxiliar para manejar respuestas HTTP
 * @param {Response} response - Objeto Response de fetch
 * @returns {Promise<Object>} - Datos parseados o error
 */
function formatUnknown(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  try { return JSON.stringify(value); } catch { return String(value); }
}

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    if (contentType?.includes('application/json')) {
      try {
        const errorData = await response.json();
        const primary = errorData.detail || errorData.message || errorData.error || errorData.errors;
  const formatted = String(formatUnknown(primary) || '');
  errorMessage = formatted || errorMessage;
      } catch {}
    } else {
      try { errorMessage = await response.text(); } catch {}
    }
    throw new Error(errorMessage);
  }
  if (contentType?.includes('application/json')) return await response.json();
  return await response.text();
}

/**
 * Verifica el estado de salud de la API
 * @returns {Promise<Object>} Estado de salud del servicio
 */
export async function getApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health/`, {
      method: 'GET',
      ...defaultRequestConfig,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error verificando estado de la API:', error);
    throw new Error(`No se pudo verificar el estado de la API: ${error.message}`);
  }
}

/**
 * Obtiene información general de la API
 * @returns {Promise<Object>} Información del servicio, versión y endpoints disponibles
 */
export async function getApiInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      ...defaultRequestConfig,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error obteniendo información de la API:', error);
    throw new Error(`No se pudo obtener información de la API: ${error.message}`);
  }
}

/**
 * Analiza un texto para detectar noticias falsas
 * @param {string} text - Texto a analizar
 * @param {Object} options - Opciones adicionales de análisis
 * @returns {Promise<Object>} Resultado del análisis con score de confianza y clasificación
 */
export async function analyzeText(text, options = {}) {
  if (!text || text.trim().length === 0) {
    throw new Error('El texto a analizar no puede estar vacío');
  }

  if (text.length > 10000) {
    throw new Error('El texto es demasiado largo (máximo 10,000 caracteres)');
  }

  try {
    // Usar FormData (según OpenAPI: multipart/form-data acepta text/url/file)
    const formData = new FormData();
    formData.append('text', text.trim());
    for (const [key, value] of Object.entries(options)) formData.append(key, value);

    const response = await fetch(`${API_BASE_URL}/analyze/`, {
      method: 'POST',
      headers: withAuthHeaders(), // no Content-Type para FormData
      body: formData,
    });

    const result = await handleResponse(response);

    const analysisTimeSec = typeof result.analysis_time_ms === 'number' ? (result.analysis_time_ms / 1000) : (result.analysis_time || result.processing_time || 0);
    // Normalizar respuesta para consistencia
    return {
      ...result,
      confidence: result.confidence ?? result.score ?? 0,
      prediction: (result.prediction || result.classification || result.label || 'unknown').toString().toLowerCase(),
      analysis_time: analysisTimeSec,
      text_length: result.content_length || text.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analizando texto:', error);
    throw new Error(`Error en análisis de texto: ${error.message}`);
  }
}

/**
 * Analiza una URL extrayendo su contenido y detectando noticias falsas
 * @param {string} url - URL a analizar
 * @param {Object} options - Opciones adicionales de análisis
 * @returns {Promise<Object>} Resultado del análisis con score de confianza y clasificación
 */
export async function analyzeUrl(url, options = {}) {
  if (!url || url.trim().length === 0) {
    throw new Error('La URL no puede estar vacía');
  }
  try { new URL(url); } catch { throw new Error('La URL proporcionada no es válida'); }

  try {
    // Enviar como FormData con campo 'url'
    const formData = new FormData();
    formData.append('url', url.trim());
    for (const [key, value] of Object.entries(options)) formData.append(key, value);

    const response = await fetch(`${API_BASE_URL}/analyze/`, {
      method: 'POST',
      headers: withAuthHeaders(),
      body: formData,
    });

    const result = await handleResponse(response);
    const analysisTimeSec = typeof result.analysis_time_ms === 'number' ? (result.analysis_time_ms / 1000) : (result.analysis_time || result.processing_time || 0);
    return {
      ...result,
      confidence: result.confidence ?? result.score ?? 0,
      prediction: (result.prediction || result.classification || result.label || 'unknown').toString().toLowerCase(),
      source_url: url,
      extracted_text_length: result.content_length || 0,
      analysis_time: analysisTimeSec,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Error en análisis de URL: ${error.message}`);
  }
}

/**
 * Obtiene métricas y estadísticas de la API
 * @returns {Promise<Object>} Resumen de métricas del servicio
 */
export async function getApiMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/summary`, {
      method: 'GET',
      ...defaultRequestConfig,
      headers: withAuthHeaders(defaultRequestConfig.headers),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error obteniendo métricas de la API:', error);
    throw new Error(`No se pudieron obtener las métricas: ${error.message}`);
  }
}

/**
 * Analiza el contenido de un archivo para detectar noticias falsas
 * @param {File} file - Archivo a analizar
 * @param {Object} options - Opciones adicionales de análisis
 * @returns {Promise<Object>} Resultado del análisis con score de confianza y clasificación
 */
export async function analyzeFile(file, options = {}) {
  if (!file) {
    throw new Error('No se proporcionó ningún archivo');
  }

  // Validar tamaño del archivo (máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('El archivo es demasiado grande (máximo 5MB)');
  }

  try {
    // Enviar como archivo binario usando FormData directamente a /analyze/
    const formData = new FormData();
    formData.append('file', file);
    for (const [key, value] of Object.entries(options)) formData.append(key, value);

    const response = await fetch(`${API_BASE_URL}/analyze/`, {
      method: 'POST',
      headers: withAuthHeaders(),
      body: formData,
    });

    const result = await handleResponse(response);
    const analysisTimeSec = typeof result.analysis_time_ms === 'number' ? (result.analysis_time_ms / 1000) : (result.analysis_time || result.processing_time || 0);
    return {
      ...result,
      confidence: result.confidence ?? result.score ?? 0,
      prediction: (result.prediction || result.classification || result.label || 'unknown').toString().toLowerCase(),
      source_file: file.name,
      file_size: file.size,
      file_type: file.type,
      extracted_text_length: result.content_length || 0,
      analysis_time: analysisTimeSec,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analizando archivo:', error);
    throw new Error(`Error en análisis de archivo: ${error.message}`);
  }
}

/**
 * Función auxiliar para leer el contenido de un archivo
 * @param {File} file - Archivo a leer
 * @returns {Promise<string>} Contenido del archivo como texto
 */
async function readFileContent(file) {
  const blobText = await file.text();
  try {
    let text = blobText;
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      return text;
    }
    if (file.type === 'application/pdf') {
      throw new Error('Los archivos PDF requieren procesamiento adicional. Use texto plano por ahora.');
    }
    if (file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      text = doc.body?.textContent || doc.textContent || text;
    }
    return text;
  } catch (error) {
    throw new Error(`No se pudo leer el archivo: ${error.message}`);
  }
}

/**
 * Función de utilidad para probar la conectividad completa de la API
 * @returns {Promise<Object>} Resultado completo de las pruebas
 */
export async function testApiConnectivity() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    // Probar endpoint de info
    const startInfo = Date.now();
    results.tests.info = await getApiInfo();
    results.tests.info.response_time = Date.now() - startInfo;
    results.tests.info.status = 'success';
  } catch (error) {
    results.tests.info = {
      status: 'error',
      error: error.message
    };
  }

  try {
    // Probar endpoint de health
    const startHealth = Date.now();
    results.tests.health = await getApiHealth();
    results.tests.health.response_time = Date.now() - startHealth;
    results.tests.health.status = 'success';
  } catch (error) {
    results.tests.health = {
      status: 'error',
      error: error.message
    };
  }

  try {
    // Probar endpoint de métricas
    const startMetrics = Date.now();
    results.tests.metrics = await getApiMetrics();
    results.tests.metrics.response_time = Date.now() - startMetrics;
    results.tests.metrics.status = 'success';
  } catch (error) {
    results.tests.metrics = {
      status: 'error',
      error: error.message
    };
  }

  return results;
}

/**
 * Registra un nuevo usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Usuario público registrado
 */
export async function registerUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: withAuthHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/json' }),
      body: JSON.stringify({ email, password })
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error(`Error al registrar usuario: ${error.message}`);
  }
}

/**
 * Inicia sesión de usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Token de acceso
 */
export async function loginUser(email, password) {
  try {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: params
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error(`Error al iniciar sesión: ${error.message}`);
  }
}

/**
 * Constantes para interpretar los resultados de la API
 */
export const API_CLASSIFICATIONS = {
  REAL: 'real',
  FAKE: 'fake',
  UNCERTAIN: 'uncertain',
  UNKNOWN: 'unknown'
};

export const CONFIDENCE_LEVELS = {
  VERY_HIGH: { min: 0.9, label: 'Muy Alta', color: '#22c55e' },
  HIGH: { min: 0.7, label: 'Alta', color: '#3b82f6' },
  MEDIUM: { min: 0.5, label: 'Media', color: '#f59e0b' },
  LOW: { min: 0.3, label: 'Baja', color: '#ef4444' },
  VERY_LOW: { min: 0, label: 'Muy Baja', color: '#991b1b' }
};

/**
 * Función auxiliar para interpretar el nivel de confianza
 * @param {number} confidence - Score de confianza (0-1)
 * @returns {Object} Objeto con información del nivel de confianza
 */
export function getConfidenceLevel(confidence) {
  for (const [level, config] of Object.entries(CONFIDENCE_LEVELS)) {
    if (confidence >= config.min) {
      return {
        level,
        ...config,
        score: confidence
      };
    }
  }
  return {
    level: 'VERY_LOW',
    ...CONFIDENCE_LEVELS.VERY_LOW,
    score: confidence
  };
}
