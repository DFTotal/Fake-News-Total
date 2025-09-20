/**
 * Fake News Detection API Client
 * Basado en la API de detección de noticias falsas https://fakenewsignacio.vercel.app
 */

const API_BASE_URL = 'https://fakenewsignacio.vercel.app';

// Configuración por defecto para las peticiones
const defaultRequestConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 segundos de timeout
};

/**
 * Función auxiliar para manejar respuestas HTTP
 * @param {Response} response - Objeto Response de fetch
 * @returns {Promise<Object>} - Datos parseados o error
 */
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    // Intentar obtener más detalles del error si hay un cuerpo de respuesta
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // Si no se puede parsear el JSON, usar el mensaje por defecto
      }
    }
    
    throw new Error(errorMessage);
  }
  
  // Parsear respuesta JSON
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return await response.text();
}

/**
 * Verifica el estado de salud de la API
 * @returns {Promise<Object>} Estado de salud del servicio
 */
export async function getApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
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
    const requestBody = {
      text: text.trim(),
      ...options // Permite pasar opciones adicionales como language, model, etc.
    };

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      ...defaultRequestConfig,
      body: JSON.stringify(requestBody)
    });
    
    const result = await handleResponse(response);
    
    // Normalizar respuesta para consistencia
    return {
      ...result,
      confidence: result.confidence || result.score || 0,
      prediction: result.prediction || result.classification || 'unknown',
      analysis_time: result.analysis_time || result.processing_time || 0,
      text_length: text.length,
      timestamp: new Date().toISOString()
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
  
  // Validación básica de URL
  try {
    new URL(url);
  } catch (e) {
    throw new Error('La URL proporcionada no es válida');
  }

  try {
    const requestBody = {
      url: url.trim(),
      ...options // Opciones como extract_method, timeout, etc.
    };

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      ...defaultRequestConfig,
      body: JSON.stringify(requestBody)
    });
    
    const result = await handleResponse(response);
    
    // Normalizar respuesta
    return {
      ...result,
      confidence: result.confidence || result.score || 0,
      prediction: result.prediction || result.classification || 'unknown',
      source_url: url,
      extracted_text_length: result.extracted_text?.length || 0,
      analysis_time: result.analysis_time || result.processing_time || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error analizando URL:', error);
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
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Error obteniendo métricas de la API:', error);
    throw new Error(`No se pudieron obtener las métricas: ${error.message}`);
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
