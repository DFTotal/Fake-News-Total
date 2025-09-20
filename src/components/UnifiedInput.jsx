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
      {/* Área principal con diseño mejorado */}
      <div className="relative bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/50 overflow-hidden backdrop-blur-sm">
        {/* Etiqueta "Smart" mejorada */}
        <div className="absolute -top-3 left-6 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xs px-4 py-2 rounded-full shadow-lg font-medium">
          <span className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-pulse"></div>
            <span>Smart</span>
          </span>
        </div>
        
        {/* Área de texto/drag & drop mejorada */}
        <div
          className={`border-2 border-dashed rounded-2xl m-4 p-6 min-h-[180px] transition-all duration-300 ${
            dragActive 
              ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-inner' 
              : selectedFile 
                ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-inner'
                : 'border-slate-300 bg-gradient-to-br from-slate-50 to-white hover:border-slate-400'
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

        {/* Área inferior con botón y mensaje mejorada */}
        <div className="flex items-center justify-between mt-4 px-4 py-3 bg-slate-50/50 rounded-xl border border-slate-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-600 font-medium">Escribe, pega URL o selecciona archivo</span>
          </div>
          
          <button
            onClick={openFileDialog}
            disabled={loading}
            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-slate-500/20 hover:shadow-xl hover:shadow-slate-500/30 transform hover:scale-105"
          >
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>Seleccionar archivo</span>
            </span>
          </button>
        </div>

        {/* Botón de análisis mejorado */}
        <button
          onClick={handleSubmit}
          disabled={!hasContent || loading}
          className={`w-full mt-6 py-4 rounded-2xl font-bold text-white transition-all duration-300 transform ${
            !hasContent || loading
              ? 'bg-gradient-to-r from-gray-300 to-gray-400 cursor-not-allowed scale-95'
              : 'bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 hover:from-slate-700 hover:via-slate-800 hover:to-slate-900 shadow-xl shadow-slate-500/30 hover:shadow-2xl hover:shadow-slate-600/40 hover:scale-105 active:scale-95'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center space-x-3">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analizando contenido...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <span>🔍</span>
              <span>Analizar Contenido</span>
            </span>
          )}
        </button>

        {/* Mensaje informativo mejorado */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
          <p className="text-center text-xs text-blue-700/80 leading-relaxed">
            <span className="inline-flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Privacidad:</span>
            </span>
            {' '}No incluyas información personal. El sistema detecta automáticamente el tipo de contenido.
          </p>
        </div>
      </div>
    </div>
  );
}