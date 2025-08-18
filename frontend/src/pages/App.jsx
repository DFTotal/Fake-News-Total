import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Tabs from '../components/Tabs';
import UploadArea from '../components/UploadArea';

export default function App() {
  const [mode, setMode] = useState('url');
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    // Placeholder: in future call backend for detection
    alert(`Analizando (${mode}): ${typeof value === 'string' ? value.slice(0, 60) : value?.name}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-200 text-slate-800">
      <Navbar />
      <main className="flex-1 px-6 md:px-16">
        <p className="text-center text-sm md:text-base text-slate-600 max-w-2xl mx-auto mt-4">
          Analice archivos, Textos, y URL sospechosos para detectar Noticias Falsas y otras infracciones y compártalos automáticamente con la comunidad de seguridad.
        </p>
        <Tabs current={mode} onChange={(m) => { setMode(m); setValue(''); }} />
        <UploadArea mode={mode} value={value} onChange={setValue} onSubmit={handleSubmit} />
      </main>
    </div>
  );
}
