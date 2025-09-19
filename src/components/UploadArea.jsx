import React from 'react';

export default function UploadArea({ mode, value, onChange, onSubmit, loading = false }) {
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="max-w-xl mx-auto w-full flex flex-col items-center">
      {/* Logo FAKE */}
      <div className="w-40 h-40 mb-6 flex items-center justify-center">
        <img src="/DFTotal-fake.png" alt="Fake icon" className="w-full h-full object-contain drop-shadow" />
      </div>
      {mode === 'url' && (
        <input
          type="url"
          placeholder="Busca una URL"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-md bg-slate-300 placeholder-slate-600 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          required
        />
      )}
      {mode === 'text' && (
        <textarea
          rows={6}
            placeholder="Pegue el texto a analizar"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-slate-300 placeholder-slate-600 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            required
        />
      )}
      {mode === 'file' && (
        <input
          type="file"
          onChange={e => onChange(e.target.files?.[0] || null)}
          className="w-full text-slate-700"
        />
      )}
      <button 
        type="submit" 
        disabled={loading || !value}
        className="mt-6 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium px-10 py-3 rounded-md shadow transition"
      >
        {loading ? 'Analizando...' : 'Buscar'}
      </button>
      <p className="text-xs text-center text-slate-600 mt-10 leading-relaxed max-w-lg">
        Al enviar los datos arriba, acepta nuestros Términos de Servicio y Aviso de Privacidad, así como compartir la URL que envió con la comunidad de seguridad. No envíe información personal; no nos hacemos responsables del contenido de su envío.
      </p>
    </form>
  );
}
