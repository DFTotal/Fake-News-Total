import React from 'react';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-5">
      <div className="flex items-center space-x-4">
        {/* Logo */}
        <img src="/Logo-DFTotal.png" alt="Deepfake Total Logo" className="w-20 h-20 object-contain drop-shadow" />
        <div>
          <h1 className="text-5xl font-light tracking-tight text-slate-700 leading-none">DEEPFAKE</h1>
          <span className="text-5xl font-extralight text-slate-400 -mt-2 block leading-none">TOTAL</span>
        </div>
      </div>
      <button className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-2 rounded-md shadow transition">Sign Up</button>
    </nav>
  );
}
