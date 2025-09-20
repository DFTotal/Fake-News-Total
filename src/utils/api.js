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
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        const primary = errorData.detail || errorData.message || errorData.error || errorData.errors;
        errorMessage = formatUnknown(primary) || errorMessage;
      } catch {}
    } else {
      try { errorMessage = await response.text(); } catch {}
    }
    throw new Error(errorMessage);
  }
  if (contentType && contentType.includes('application/json')) return await response.json();
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
    // Leer el contenido del archivo
    const text = await readFileContent(file);
    
    if (!text || text.trim().length === 0) {
      throw new Error('El archivo no contiene texto legible');
    }

    // Usar la función analyzeText con el contenido extraído
    const result = await analyzeText(text, options);
    
    return {
      ...result,
      source_file: file.name,
      file_size: file.size,
      file_type: file.type,
      extracted_text_length: text.length
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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        let text = e.target.result;
        
        // Si es un archivo de texto plano, usar directamente
        if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          resolve(text);
          return;
        }
        
        // Para otros tipos, intentar extraer texto
        // Nota: Para PDFs complejos se necesitaría una librería como pdf.js
        if (file.type === 'application/pdf') {
          // Por ahora, mostrar mensaje informativo para PDFs
          throw new Error('Los archivos PDF requieren procesamiento adicional. Use texto plano por ahora.');
        }
        
        // Para HTML, extraer texto básico
        if (file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          text = doc.body?.textContent || doc.textContent || text;
        }
        
        resolve(text);
      } catch (error) {
        reject(new Error(`No se pudo leer el archivo: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsText(file);
  });
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
