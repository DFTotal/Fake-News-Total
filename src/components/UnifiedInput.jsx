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
    <div className="max-w-2xl mx-auto mt-6">
      {/* Área principal con el estilo original */}
      <div className="relative bg-white">
        {/* Etiqueta "Smart" */}
        <div className="absolute -top-2 left-4 bg-slate-600 text-white text-xs px-3 py-1 rounded">
          Smart
        </div>
        
        {/* Área de texto/drag & drop */}
        <div
          className={`border-2 border-dashed border-slate-300 rounded p-4 min-h-[160px] transition-all duration-200 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : selectedFile 
                ? 'border-green-500 bg-green-50'
                : 'bg-slate-50'
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
              <textarea
                value={value}
                onChange={handleTextChange}
                placeholder="Pega texto, escribe una URL o suelta un archivo aquí"
                className="w-full h-full border-none resize-none focus:outline-none bg-transparent placeholder-gray-500 text-gray-800 p-0"
                disabled={loading}
              />
            )}
          </div>

          {/* Overlay de drag activo */}
          {dragActive && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center">
              <div className="bg-blue-500 text-white px-4 py-2 rounded font-medium text-sm">
                📁 Suelte el archivo aquí
              </div>
            </div>
          )}
        </div>

        {/* Área inferior con botón y mensaje */}
        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>Escribe o pega texto, URL o selecciona un archivo</span>
          </div>
          
          <button
            onClick={openFileDialog}
            disabled={loading}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            Seleccionar archivo
          </button>
        </div>

        {/* Botón de análisis */}
        <button
          onClick={handleSubmit}
          disabled={!hasContent || loading}
          className={`w-full mt-4 py-3 rounded font-semibold text-white transition-all duration-200 ${
            !hasContent || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-slate-600 hover:bg-slate-700'
          }`}
        >
          {loading ? 'Analizando...' : 'Analizar'}
        </button>

        {/* Mensaje informativo */}
        <p className="text-center text-xs text-gray-500 mt-4">
          No incluyas datos personales. La detección decide automáticamente el tipo (URL, Texto o Archivo) según el contenido que proporciones.
        </p>
      </div>
    </div>
  );
}