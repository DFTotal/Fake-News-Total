import React from 'react';

export default function Tabs({ current, onChange }) {
  const tabs = [
    { id: 'url', label: 'URL' },
    { id: 'text', label: 'Texto' },
    { id: 'file', label: 'Archivo' }
  ];
  return (
    <div className="flex justify-center space-x-12 mt-8 mb-4">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`pb-2 border-b-2 transition-colors text-sm md:text-base tracking-wide ${current === t.id ? 'border-brand-600 text-brand-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
