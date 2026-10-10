"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAllAccounts, Account } from "@/lib/userStore";

export function CartaUi() {
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

  useEffect(() => {
    const accounts = getAllAccounts();
    // Buscar la cuenta activa marcada con isCurrent = true
    const active = accounts.find((a) => a.isCurrent) || accounts[0];
    setCurrentAccount(active);
  }, []);

  if (!currentAccount) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Cargando tu universo privado...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Navbar superior */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span className="font-serif font-bold text-lg text-white">Astra<span className="text-rose-500">Red</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <Link href="/carta" className="text-rose-400 font-bold">Carta Natal</Link>
          <Link href="/destinos" className="hover:text-white transition">Destinos</Link>
          <Link href="/calendario" className="hover:text-white transition">Calendario VIP</Link>
          <Link href="/mensajes" className="hover:text-white transition">Mensajes</Link>
          <Link href="/cuenta" className="hover:text-white transition">Cuenta</Link>
        </nav>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Tarjeta de Perfil Dinámica */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentAccount.avatar || "✨"}</span>
                <h1 className="text-2xl font-serif font-bold text-white">{currentAccount.name}</h1>
              </div>
              <p className="text-xs text-purple-400 font-mono">
                📍 {currentAccount.location || "Ubicación no especificada"} &bull; Miembro {currentAccount.membership.toUpperCase()}
              </p>
              <p className="text-xs text-slate-400 italic">
                &quot;Universo privado sincronizado y protegido.&quot;
              </p>
            </div>
            <button
              onClick={() => alert("Enlace de carta copiado al portapapeles.")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl transition border border-slate-700 cursor-pointer"
            >
              Compartir Carta
            </button>
          </div>
        </div>

        {/* Sección central de la Carta Natal */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 relative min-h-[300px]">
          <div className="w-48 h-48 rounded-full border border-dashed border-rose-500/40 flex items-center justify-center relative animate-spin-slow">
            <div className="absolute w-36 h-36 rounded-full border border-purple-500/30"></div>
            <div className="text-center space-y-1">
              <span className="text-2xl">✨</span>
              <h2 className="text-sm font-serif font-bold text-amber-300">Sagitario</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">ASC Capricornio</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Calculado con base en las coordenadas exactas de <strong className="text-white">{currentAccount.location}</strong> para <strong className="text-white">{currentAccount.name}</strong>.
          </p>
        </div>

        {/* Tríada Astrológica */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold tracking-wider uppercase">☀️ Sol</span>
            <h3 className="text-sm font-bold text-white">Sagitario</h3>
            <p className="text-xs text-slate-400">Esencia, vitalidad y propósito de vida.</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] text-purple-400 font-bold tracking-wider uppercase">🌙 Luna</span>
            <h3 className="text-sm font-bold text-white">Acuario</h3>
            <p className="text-xs text-slate-400">Mundo emocional, intuición y refugio.</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] text-rose-400 font-bold tracking-wider uppercase">🌅 Ascendente</span>
            <h3 className="text-sm font-bold text-white">Capricornio</h3>
            <p className="text-xs text-slate-400">Máscara social y aprendizaje de vida.</p>
          </div>
        </div>

      </main>
    </div>
  );
}
