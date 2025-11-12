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

  // Manejar envío con validación de longitud mínima
  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile, 'file');
    } else if (value.trim()) {
      const trimmedValue = value.trim();
      const type = isUrl(trimmedValue) ? 'url' : 'text';
      
      // ⚠️ VALIDACIÓN: Advertir si el texto es muy corto para análisis confiable
      // Titulares típicos: 30-100 caracteres
      // Para análisis de fake news necesitamos contexto suficiente
      if (type === 'text' && trimmedValue.length < 20) {
        alert(
          '⚠️ TEXTO MUY CORTO\n\n' +
          `El texto tiene solo ${trimmedValue.length} caracteres.\n\n` +
          'Para un análisis confiable de noticias, se recomienda:\n' +
          '• Mínimo: 20 caracteres (titular corto)\n' +
          '• Ideal: 50+ caracteres (titular completo)\n' +
          '• Mejor: 100+ caracteres (con contexto)\n\n' +
          'Textos muy cortos pueden dar resultados poco precisos.'
        );
        return;
      }
      
      onSubmit(trimmedValue, type);
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
    <div className="max-w-xl mx-auto">
      <div className="relative bg-white border border-gray-200 rounded-lg">
        <div className="absolute -top-2 left-3 bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded-full">Smart</div>
        
        {/* Loading indicator dentro del panel */}
        {loading ? (
          <div className="m-3 p-6 border-2 border-dashed border-gray-300 rounded-md min-h-[140px] flex flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              {/* Spinner */}
              <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-700 rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-slate-700">Analizando contenido</span>
            </div>
            
            {/* Barra de progreso animada */}
            <div className="w-full max-w-sm bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
              <div className="h-full bg-slate-700 rounded-full animate-pulse" style={{width: '100%'}}></div>
            </div>
            
            {/* Pasos del análisis */}
            <div className="space-y-2 text-xs text-slate-600 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-slate-700 rounded-full animate-pulse"></div>
                <span>Consultando 6 modelos de IA</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-slate-700 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <span>Verificando con fact-checkers</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-slate-700 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                <span>Calculando consenso</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-md m-3 p-4 min-h-[140px] text-sm transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50/40' : selectedFile ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
          <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.pdf,.html,.htm,.csv,.md,text/plain,application/pdf,text/html,text/csv" onChange={handleFileInput} />
          <div className="h-full flex flex-col">
            {selectedFile ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 text-base">📄</div>
                <p className="text-xs font-medium text-slate-700 truncate max-w-[180px]" title={selectedFile.name}>{selectedFile.name}</p>
                <p className="text-[10px] text-soft">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                <button onClick={clearAll} className="mt-2 text-[10px] text-rose-600 hover:underline">Quitar</button>
              </div>
            ) : (
              <textarea
                value={value}
                onChange={handleTextChange}
                placeholder="Pega texto, escribe una URL o suelta un archivo aquí"
                className="w-full h-full border-none resize-none focus:outline-none bg-transparent placeholder-gray-500 text-slate-700 leading-relaxed"
                disabled={loading}
                rows={5}
              />
            )}
          </div>
          {dragActive && !selectedFile && (
            <div className="absolute inset-0 bg-blue-50/70 flex items-center justify-center text-xs text-blue-700 font-medium rounded-md">Suelta el archivo</div>
          )}
          </div>
        )}
        
        <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50 rounded-b-lg">
          <div className="flex items-center gap-2 text-[11px] text-soft">
            {selectedFile ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Archivo listo</span>
              </>
            ) : value.trim() ? (
              <>
                <span className={`w-2 h-2 rounded-full ${
                  value.trim().length < 20 ? 'bg-rose-500' : 
                  value.trim().length < 50 ? 'bg-amber-500' : 
                  'bg-emerald-500'
                }`}></span>
                <span>
                  {value.trim().length} caracteres
                  {value.trim().length < 20 && ' (muy corto)'}
                  {value.trim().length >= 20 && value.trim().length < 50 && ' (titular corto)'}
                  {value.trim().length >= 50 && value.trim().length < 100 && ' (bien)'}
                  {value.trim().length >= 100 && ' (ideal)'}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span>Escribe, pega URL o selecciona archivo</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasContent && !loading && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >Limpiar</button>
            )}
            <button
              type="button"
              onClick={openFileDialog}
              disabled={loading}
              className="text-[11px] px-3 py-1.5 rounded-md bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-40"
            >Archivo</button>
          </div>
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={!hasContent || loading}
        className="w-full mt-4 py-3 rounded-md font-medium text-white text-sm bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >{loading ? 'Analizando…' : 'Analizar contenido'}</button>
      <p className="mt-3 text-center text-[11px] text-soft">No incluyas información personal. El sistema detecta automáticamente el tipo.</p>
    </div>
  );
}