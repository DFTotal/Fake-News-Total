// API de detección de noticias falsas
const API_BASE_URL = 'https://fakenewsignacio.vercel.app';

// Función para verificar el estado de la API
export async function getApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking API health:', error);
    throw error;
  }
}

// Función para obtener información de la API
export async function getApiInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting API info:', error);
    throw error;
  }
}

// Función principal para analizar texto en busca de noticias falsas
export async function analyzeText(text) {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error analyzing text:', error);
    throw error;
  }
}

// Función para analizar URL (si la API lo soporta)
export async function analyzeUrl(url) {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error analyzing URL:', error);
    throw error;
  }
}

// Función para obtener métricas de la API
export async function getApiMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/metrics/summary`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting API metrics:', error);
    throw error;
  }
}
