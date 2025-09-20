import React, { useState, useMemo } from 'react';
import { analyzeText, analyzeUrl, analyzeFile } from '../utils/api.js';

const URL_REGEX = /^(https?:\/\/)?([\w.-]+)\.[a-z]{2,}(\/[\w\-._~:?#@!$&'()*+,;=\/]*)?$/i;
const MAX_CHARS = 10000;

export default function SmartAnalyzer({ onSubmit }) {
  const [raw, setRaw] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);

  const trimmed = raw.trim();
  const detectedType = useMemo(() => {
    if (file) return 'file';
    if (trimmed && !/\r|\n/.test(trimmed) && URL_REGEX.test(trimmed)) return 'url';
    if (trimmed.length > 0) return 'text';
    return null;
  }, [trimmed, file]);

  const helper = {
    file: 'Archivo listo para analizar',
    url: 'Detectado como URL',
    text: 'Detectado como Texto'
  }[detectedType] || 'Pega texto, URL o suelta un archivo';

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) setRaw('');
  }
  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
      setRaw('');
    }
  }
  function handleDragOver(e){ e.preventDefault(); }
  function handleDragEnter(e){ e.preventDefault(); setDrag(true); }
  function handleDragLeave(e){ e.preventDefault(); setDrag(false); }
  function clearFile(){ setFile(null); }

  async function submit(e){
    e.preventDefault();
    if (!detectedType || loading) return;
    setError(null);
    try {
      setLoading(true);
      let backend;
      if (detectedType === 'file') backend = await analyzeFile(file);
      else if (detectedType === 'url') backend = await analyzeUrl(trimmed);
      else backend = await analyzeText(trimmed);
      onSubmit({
        type: detectedType,
        value: detectedType === 'file' ? file.name : trimmed,
        fileName: file?.name || null,
        backend
      });
      if (detectedType !== 'file') setRaw('');
      setFile(null);
    } catch (err) {
      setError(err.message || 'Error desconocido');
    } finally { setLoading(false); }
  }

  const overLimit = trimmed.length > MAX_CHARS;

  return (
    <form onSubmit={submit} className="w-full max-w-2xl mx-auto" aria-label="Analizador Inteligente">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`relative bg-white border rounded-xl transition shadow-sm ${drag ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'} ${file ? 'border-emerald-300' : ''}`}
      >
        <div className="absolute -top-2 left-4 bg-gray-700 text-white text-[11px] px-2 py-0.5 rounded-full tracking-wide">Smart</div>
        {!file && (
          <textarea
            rows={6}
            value={raw}
            onChange={e => setRaw(e.target.value)}
            placeholder="Pega texto, escribe una URL o suelta un archivo aquí"
            className="w-full bg-transparent resize-none focus:outline-none p-4 text-sm leading-relaxed placeholder-gray-500"
            maxLength={MAX_CHARS + 1000}
            aria-invalid={overLimit}
          />
        )}
        {file && (
          <div className="p-6 text-center text-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">📄</div>
            <span className="font-medium max-w-full truncate" title={file.name}>{file.name}</span>
            <span className="text-xs text-gray-500 mt-1">{(file.size/1024).toFixed(1)} KB</span>
            <button type="button" onClick={clearFile} className="mt-3 text-xs text-rose-600 hover:underline">Quitar archivo</button>
          </div>
        )}
        {drag && !file && (
          <div className="absolute inset-0 bg-blue-50/70 backdrop-blur-sm flex items-center justify-center text-sm text-blue-700 font-medium">Suelta el archivo aquí</div>
        )}
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-2 rounded-b-xl text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${detectedType ? 'bg-emerald-500' : 'bg-gray-400 animate-pulse'}`}></span>
            <span>{helper}</span>
          </div>
          <div className="flex items-center gap-4">
            {!file && <span className={`tabular-nums ${overLimit ? 'text-rose-600 font-medium' : ''}`}>{trimmed.length}/{MAX_CHARS}</span>}
            <label className="cursor-pointer px-3 py-1.5 rounded-md bg-gray-700 text-white hover:bg-gray-800 transition hidden sm:inline-block">
              Archivo
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
            <label className="sm:hidden cursor-pointer text-gray-700 underline">
              Archivo
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>
      </div>
      {error && <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">{error}</div>}
      {overLimit && <div className="mt-2 text-[11px] text-rose-600">Has superado el máximo de {MAX_CHARS.toLocaleString()} caracteres.</div>}
      <button
        type="submit"
        disabled={!detectedType || loading || overLimit}
        className="mt-5 w-full bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 text-white font-medium px-10 py-3 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
      >
        {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
        {loading ? 'Analizando...' : 'Analizar contenido'}
      </button>
      <p className="text-[11px] text-center text-gray-600 mt-5 leading-relaxed">
        No incluyas datos personales. El sistema detecta automáticamente el tipo (URL, Texto o Archivo).
      </p>
    </form>
  );
}
