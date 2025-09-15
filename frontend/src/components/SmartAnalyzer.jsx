import React, { useState, useMemo } from 'react';
import { analyze } from '../utils/api.js';

/**
 * Autodetección del tipo de entrada:
 * - Si hay archivo seleccionado => 'file'
 * - Si texto cumple regex URL y no contiene salto de línea => 'url'
 * - Si longitud > 0 => 'text'
 */
const URL_REGEX = /^(https?:\/\/)?([\w.-]+)\.[a-z]{2,}(\/[^\s]*)?$/i;

export default function SmartAnalyzer({ onSubmit }) {
  const [raw, setRaw] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detectedType = useMemo(() => {
    if (file) return 'file';
    const trimmed = raw.trim();
    if (trimmed && !/\r|\n/.test(trimmed) && URL_REGEX.test(trimmed)) return 'url';
    if (trimmed.length > 0) return 'text';
    return null;
  }, [raw, file]);

  const helper = {
    file: 'Archivo listo para analizar',
    url: 'Detectado como URL',
    text: 'Detectado como Texto',
  }[detectedType] || 'Escribe o pega texto, URL, o selecciona un archivo';

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
  }

  function handleDrop(e) {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  function handleDragOver(e) { e.preventDefault(); }

  function handleClearFile() {
    setFile(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (!detectedType || loading) return;
    setError(null);
    const payload = {
      type: detectedType,
      value: detectedType === 'file' ? file : raw.trim(),
      fileName: file?.name || null,
      file: detectedType === 'file' ? file : null,
    };
    try {
      setLoading(true);
      // Llamada backend
      const res = await analyze({ type: payload.type, value: payload.value, file: payload.file });
      // Adaptar respuesta para store upstream
      onSubmit({
        type: res.source_type,
        value: payload.type === 'file' ? payload.fileName : payload.value,
        fileName: payload.fileName,
        backend: res,
      });
      if (detectedType !== 'file') setRaw('');
      setFile(null);
    } catch (err) {
      console.warn('Fallo backend, fallback local', err);
      setError(err.message || 'Error desconocido');
      // Fallback: enviar a store para no bloquear flujo
      onSubmit(payload);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl mx-auto w-full flex flex-col items-stretch" aria-label="Analizador Inteligente">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`relative rounded-lg border-2 border-dashed p-5 transition bg-slate-300/60 text-slate-800 focus-within:ring-2 focus-within:ring-brand-500 ${file ? 'border-emerald-400' : 'border-slate-400 hover:border-slate-500'}`}
      >
        {!file && (
          <textarea
            rows={6}
            value={raw}
            onChange={e => setRaw(e.target.value)}
            placeholder="Pega texto, escribe una URL o suelta un archivo aquí"
            className="w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed placeholder-slate-600"
          />
        )}
        {file && (
          <div className="flex flex-col items-center justify-center text-sm">
            <span className="font-medium truncate max-w-full" title={file.name}>{file.name}</span>
            <span className="text-[11px] text-slate-600 mt-1">{(file.size/1024).toFixed(1)} KB</span>
            <button type="button" onClick={handleClearFile} className="mt-3 text-xs text-rose-600 hover:underline">Quitar archivo</button>
          </div>
        )}
        <div className="absolute -top-3 left-4 bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded-full tracking-wide shadow">Smart</div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <span className={`w-2 h-2 rounded-full ${detectedType ? 'bg-emerald-500' : 'bg-slate-400 animate-pulse'}`} />
          <span>{helper}</span>
        </div>
        <label className="text-xs cursor-pointer px-3 py-1.5 rounded-md bg-slate-600 text-white hover:bg-slate-700 transition">
          Seleccionar archivo
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
      {error && <div className="mt-4 text-[11px] text-rose-600 bg-rose-100/60 border border-rose-200 px-3 py-2 rounded">{error}</div>}
      <button
        type="submit"
        disabled={!detectedType || loading}
        className="mt-6 bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-white font-medium px-10 py-3 rounded-md shadow transition inline-flex items-center gap-2"
      >
        {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
        {loading ? 'Analizando...' : 'Analizar'}
      </button>
      <p className="text-[11px] text-center text-slate-600 mt-6 leading-relaxed">
        No incluyas datos personales. La detección decide automáticamente el tipo (URL, Texto o Archivo) según el contenido que proporciones.
      </p>
    </form>
  );
}
