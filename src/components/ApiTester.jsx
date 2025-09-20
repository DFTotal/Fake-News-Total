import React, { useState } from 'react';
import { testApiConnectivity, analyzeText, analyzeUrl } from '../utils/api';

export default function ApiTester() {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const runTests = async () => {
    setTesting(true);
    try {
      console.log('Iniciando pruebas de conectividad...');
      const connectivity = await testApiConnectivity();
      console.log('Resultados de conectividad:', connectivity);
      
      // Prueba de análisis de texto
      console.log('Probando análisis de texto...');
      const textAnalysis = await analyzeText("Esta es una noticia de ejemplo para probar el sistema de detección.");
      console.log('Resultado análisis de texto:', textAnalysis);

      setTestResults({
        connectivity,
        textAnalysis,
        status: 'success'
      });
    } catch (error) {
      console.error('Error en las pruebas:', error);
      setTestResults({
        error: error.message,
        status: 'error'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow border">
      <h3 className="text-lg font-semibold mb-4">🧪 Pruebas de API</h3>
      
      <button
        onClick={runTests}
        disabled={testing}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mb-4"
      >
        {testing ? 'Ejecutando pruebas...' : 'Ejecutar pruebas de conectividad'}
      </button>

      {testResults && (
        <div className="mt-4">
          {testResults.status === 'success' ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <h4 className="font-medium text-green-800">✅ Pruebas exitosas</h4>
                <p className="text-sm text-green-600">Todos los endpoints funcionan correctamente</p>
              </div>
              
              {testResults.textAnalysis && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-800">📊 Resultado del análisis de prueba:</h4>
                  <p className="text-sm">
                    Confianza: {(testResults.textAnalysis.confidence * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm">
                    Predicción: {testResults.textAnalysis.prediction}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <h4 className="font-medium text-red-800">❌ Error en las pruebas</h4>
              <p className="text-sm text-red-600">{testResults.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}