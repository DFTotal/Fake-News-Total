import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ onOpenAuth }) {
  const authToken = localStorage.getItem('access_token');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/');
  };

  return (
    <nav className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="/Logo-DFTotal.png" alt="Deepfake Total" className="w-12 h-12 object-contain" />
        <div className="leading-none">
          <h1 className="text-xl font-semibold tracking-tight text-slate-700">
            Deepfake <span className="text-slate-400 font-light">Total</span>
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <a href="#" className="text-xs text-soft hover:text-slate-700 transition">Docs</a>
        <a href="#" className="text-xs text-soft hover:text-slate-700 transition">API</a>
        {!authToken ? (
          (() => {
            if (onOpenAuth) {
              return <button type="button" className="button-accent" onClick={() => onOpenAuth('signup')}>Sign Up</button>;
            }
            return <Link to="/auth" className="button-accent">Sign Up</Link>;
          })()
        ) : (
          <button
            className="button-accent bg-red-600 hover:bg-red-700 text-white"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </button>
        )}
      </div>
    </nav>
  );
}
