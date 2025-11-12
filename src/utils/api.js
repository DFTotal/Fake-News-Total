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
        
        // Si es error 500, dar mensaje más amigable
        if (response.status >= 500) {
          errorMessage = `Error del servidor: ${errorMessage}. Intenta de nuevo o usa otro tipo de análisis.`;
        }
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
    // Usar /ping (sin dependencias de BD) para serverless
    const response = await fetch(`${API_BASE_URL}/health/ping`, {
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
 * Verifica el estado de la base de datos
 * @returns {Promise<Object>} Estado de la conexión a la base de datos
 */
export async function getDatabaseHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health/database`, {
      method: 'GET',
      ...defaultRequestConfig,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error verificando estado de la base de datos:', error);
    // Devolver estado degradado en lugar de fallar
    return { status: 'degraded', connection: false, error: error.message };
  }
}

/**
 * Verifica el estado del modelo de IA
 * @returns {Promise<Object>} Estado del modelo de análisis
 */
export async function getAIModelHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health/ai-model`, {
      method: 'GET',
      ...defaultRequestConfig,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error verificando estado del modelo de IA:', error);
    // Devolver estado degradado en lugar de fallar
    return { status: 'degraded', model_loaded: false, error: error.message };
  }
}

/**
 * Verifica el estado del extractor web
 * @returns {Promise<Object>} Estado del servicio de extracción web
 */
export async function getWebExtractorHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health/web-extractor`, {
      method: 'GET',
      ...defaultRequestConfig,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error verificando estado del extractor web:', error);
    // Devolver estado degradado en lugar de fallar
    return { status: 'degraded', extractor_available: false, error: error.message };
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
 * Obtiene métricas en serie temporal (últimos 7 días)
 * @returns {Promise<Object>} Datos de análisis por día
 */
export async function getMetricsTimeseries() {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/timeseries`, {
      method: 'GET',
      ...defaultRequestConfig,
      headers: withAuthHeaders(defaultRequestConfig.headers),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error obteniendo serie temporal de métricas:', error);
    throw new Error(`No se pudo obtener la serie temporal: ${error.message}`);
  }
}

/**
 * Obtiene la lista de modelos de IA disponibles
 * @returns {Promise<Object>} Lista de modelos con información detallada
 */
export async function getAvailableModels() {
  try {
    const response = await fetch(`${API_BASE_URL}/models/`, {
      method: 'GET',
      ...defaultRequestConfig,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error obteniendo modelos disponibles:', error);
    throw new Error(`No se pudieron obtener los modelos: ${error.message}`);
  }
}

/**
 * Obtiene el modelo de IA actualmente en uso
 * @returns {Promise<Object>} Información del modelo actual
 */
export async function getCurrentModel() {
  try {
    const response = await fetch(`${API_BASE_URL}/models/current`, {
      method: 'GET',
      ...defaultRequestConfig,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error obteniendo modelo actual:', error);
    throw new Error(`No se pudo obtener el modelo actual: ${error.message}`);
  }
}

/**
 * Cambia el modelo de IA para análisis
 * @param {string} modelName - Nombre del modelo a usar (ej: "GonzaloA/fake-news-detection-spanish")
 * @returns {Promise<Object>} Confirmación del cambio
 */
export async function changeModel(modelName) {
  try {
    const response = await fetch(`${API_BASE_URL}/models/change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...withAuthHeaders(),
      },
      body: JSON.stringify({ model_name: modelName }),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error cambiando modelo:', error);
    throw new Error(`No se pudo cambiar el modelo: ${error.message}`);
  }
}

/**
 * Analiza contenido con TODOS los modelos de IA disponibles y retorna consenso
 * @param {string} content - Texto a analizar
 * @param {string} type - Tipo de contenido: 'text', 'url', o 'file'
 * @param {File} file - Archivo (solo si type='file')
 * @returns {Promise<Object>} Resultado con consenso de todos los modelos
 */
export async function analyzeWithAllModels(content, type = 'text', file = null) {
  try {
    // 1. Obtener lista de todos los modelos disponibles
    const modelsData = await getAvailableModels();
    const models = modelsData.available_models || [];
    
    if (models.length === 0) {
      throw new Error('No hay modelos disponibles');
    }

    console.log(`🔍 Analizando con ${models.length} modelos de IA...`);
    
    // 2. Analizar con cada modelo
    const results = [];
    for (const model of models) {
      try {
        // Cambiar al modelo actual
        await changeModel(model.model_id);
        
        // Realizar análisis según el tipo
        let result;
        if (type === 'url') {
          result = await analyzeUrl(content);
        } else if (type === 'file' && file) {
          result = await analyzeFile(file);
        } else {
          result = await analyzeText(content);
        }
        
        results.push({
          model_id: model.model_id,
          model_name: model.name || model.model_id,
          language: model.language,
          accuracy: model.accuracy,
          prediction: (result.prediction || result.label || '').toLowerCase(),
          confidence: result.confidence || 0,
          score: result.score || 0,
          full_result: result,
        });
        
        console.log(`✓ ${model.model_id}: ${result.prediction} (${Math.round((result.confidence || 0) * 100)}%)`);
      } catch (modelError) {
        console.warn(`⚠ Error con modelo ${model.model_id}:`, modelError.message);
        // Continuar con el siguiente modelo
      }
    }

    if (results.length === 0) {
      throw new Error('Ningún modelo pudo analizar el contenido');
    }

    // 3. Calcular consenso
    const fakeCount = results.filter(r => r.prediction === 'fake' || r.prediction === 'false').length;
    const realCount = results.filter(r => r.prediction === 'real' || r.prediction === 'true').length;
    const uncertainCount = results.filter(r => r.prediction === 'uncertain').length;

    // Promedio de confianza
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    // Promedio de score
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    // Determinar veredicto por mayoría
    let consensusPrediction;
    if (fakeCount > realCount) {
      consensusPrediction = 'fake';
    } else if (realCount > fakeCount) {
      consensusPrediction = 'real';
    } else {
      // Empate: usar promedio de scores
      consensusPrediction = avgScore > 0.5 ? 'real' : 'fake';
    }

    // Calcular confianza del consenso (más modelos de acuerdo = más confianza)
    const maxCount = Math.max(fakeCount, realCount);
    const consensusStrength = maxCount / results.length; // 0-1
    const consensusConfidence = avgConfidence * consensusStrength;

    return {
      // Resultado del consenso
      prediction: consensusPrediction,
      confidence: consensusConfidence,
      score: avgScore,
      
      // Detalles del análisis multi-modelo
      multi_model_analysis: {
        total_models: results.length,
        fake_votes: fakeCount,
        real_votes: realCount,
        uncertain_votes: uncertainCount,
        average_confidence: avgConfidence,
        average_score: avgScore,
        consensus_strength: consensusStrength,
        individual_results: results,
      },
      
      // Copiar datos adicionales del primer resultado exitoso
      ...(results[0]?.full_result || {}),
    };
  } catch (error) {
    console.error('Error en análisis multi-modelo:', error);
    throw error;
  }
}

/**
 * Obtiene el estado de las APIs de fact-checking externas
 * @returns {Promise<Object>} Estado de cada API (google_fact_check, claimbuster, etc.)
 */
export async function getFactCheckStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/fact-check/status`, {
      method: 'GET',
      ...defaultRequestConfig,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error obteniendo estado de fact-check APIs:', error);
    throw new Error(`No se pudo obtener el estado de las APIs: ${error.message}`);
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

/**
 * Verifica un texto o URL contra múltiples fact-checkers (Google, RapidAPI, etc.)
 * @param {string} text - Texto a verificar
 * @param {string|null} url - URL a verificar (opcional)
 * @returns {Promise<Object>} Resultados de fact-checking
 */
export async function checkFactsMulti(text, url = null) {
  try {
    const payload = { text };
    if (url) {
      payload.url = url;
    }

    const response = await fetch(`${API_BASE_URL}/fact-check/multi-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...withAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error verificando con fact-checkers:', error);
    throw new Error(`No se pudo verificar con fact-checkers: ${error.message}`);
  }
}

/**
 * Verifica un texto contra Google Fact Check
 * @param {string} text - Texto a verificar
 * @returns {Promise<Object>} Resultados de Google Fact Check
 */
export async function checkFactsGoogle(text) {
  try {
    const response = await fetch(`${API_BASE_URL}/fact-check/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...withAuthHeaders(),
      },
      body: JSON.stringify({ text }),
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error verificando con Google:', error);
    throw new Error(`No se pudo verificar con Google: ${error.message}`);
  }
}

