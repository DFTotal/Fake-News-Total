import React, { useState, useRef } from 'react';

export default function UnifiedInput({ onSubmit, loading }) {
  const [value, setValue] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Detectar si el valor es una URL
  const isUrl = (text) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  // Manejar envío
  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile, 'file');
    } else if (value.trim()) {
      const type = isUrl(value.trim()) ? 'url' : 'text';
      onSubmit(value.trim(), type);
    }
  };

  // Manejar drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file) => {
    // Validar tipo de archivo (texto, pdf, etc.)
    const validTypes = ['text/plain', 'application/pdf', 'text/html', 'text/csv'];
    const validExtensions = ['.txt', '.pdf', '.html', '.htm', '.csv', '.md'];
    
    const isValidType = validTypes.includes(file.type);
    const isValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (isValidType || isValidExtension) {
      setSelectedFile(file);
      setValue(''); // Limpiar texto si hay archivo seleccionado
    } else {
      alert('Tipo de archivo no soportado. Use archivos de texto (.txt, .pdf, .html, .csv, .md)');
    }
  };

  // Manejar cambio en el input de texto
  const handleTextChange = (e) => {
    setValue(e.target.value);
    setSelectedFile(null); // Limpiar archivo si hay texto
  };

  // Abrir selector de archivos
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const clearAll = () => {
    setValue('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasContent = value.trim() || selectedFile;
  const contentType = selectedFile ? 'file' : isUrl(value.trim()) ? 'url' : 'text';

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-lg border-2 border-dashed border-gray-300 p-6">
        {/* Área de drag & drop */}
        <div
          className={`relative min-h-[200px] rounded-lg border-2 border-dashed transition-all duration-200 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : selectedFile 
                ? 'border-green-500 bg-green-50'
                : value.trim() && isUrl(value.trim())
                  ? 'border-purple-500 bg-purple-50'
                  : value.trim()
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Input de archivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.pdf,.html,.htm,.csv,.md,text/plain,application/pdf,text/html,text/csv"
            onChange={handleFileInput}
          />

          {/* Contenido del área */}
          <div className="h-full flex flex-col">
            {selectedFile ? (
              // Vista de archivo seleccionado
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Archivo seleccionado</h3>
                <p className="text-sm text-gray-600 mb-1">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Archivo de texto'}
                </p>
                <button
                  onClick={clearAll}
                  className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Cambiar archivo
                </button>
              </div>
            ) : (
              // Vista de entrada de texto/URL
              <>
                <div className="flex-1 flex flex-col">
                  <textarea
                    value={value}
                    onChange={handleTextChange}
                    placeholder="Pegue una URL o escriba el texto a analizar...&#10;&#10;También puede arrastrar y soltar un archivo aquí"
                    className="flex-1 w-full p-4 border-none resize-none focus:outline-none bg-transparent placeholder-gray-500 text-gray-800 min-h-[120px]"
                    disabled={loading}
                  />
                </div>

                {/* Indicadores visuales */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    {/* Indicador de tipo de contenido */}
                    {value.trim() && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        contentType === 'url' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {contentType === 'url' ? '🔗 URL detectada' : '📝 Texto'}
                      </span>
                    )}
                    
                    {/* Contador de caracteres */}
                    {value.trim() && contentType === 'text' && (
                      <span className="text-xs text-gray-500">
                        {value.length} caracteres
                      </span>
                    )}
                  </div>

                  <button
                    onClick={openFileDialog}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span>Seleccionar archivo</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Overlay de drag activo */}
          {dragActive && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center rounded-lg">
              <div className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium">
                📁 Suelte el archivo aquí
              </div>
            </div>
          )}
        </div>

        {/* Botón de análisis */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!hasContent || loading}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              !hasContent || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analizando...</span>
              </span>
            ) : (
              `🔍 Analizar ${contentType === 'url' ? 'URL' : contentType === 'file' ? 'archivo' : 'texto'}`
            )}
          </button>
        </div>

        {/* Información de ayuda */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Soporta URLs, texto plano y archivos (.txt, .pdf, .html, .csv, .md)
          </p>
        </div>
      </div>
    </div>
  );
}