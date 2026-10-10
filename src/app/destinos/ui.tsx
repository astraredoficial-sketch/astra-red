"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { AppNav } from "@/components/AppNav";
import { SEED_PROFILES } from "@/lib/profiles";
import { markSwipe } from "@/lib/storage";

export function DestinosUi() {
  const router = useRouter();
  const { me } = useSession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchAnimation, setMatchAnimation] = useState(false);

  // Lista de perfiles a explorar
  const availableProfiles = SEED_PROFILES.filter((p) => p.id !== me?.id);
  const currentProfile = availableProfiles[currentIndex];

  const handleSwipe = (action: "like" | "pass") => {
    if (!currentProfile) return;

    markSwipe(currentProfile.id, action);

    if (action === "like") {
      setMatchAnimation(true);
      // Redirige al chat del usuario de forma inmediata tras mostrar la sincronía cósmica
      setTimeout(() => {
        setMatchAnimation(false);
        router.push("/mensajes/" + currentProfile.id);
      }, 1000);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Navegación Superior Global */}
      <AppNav active="destinos" />

      <main className="max-w-md mx-auto p-4 flex-1 flex flex-col items-center justify-center w-full">
        {currentProfile ? (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-6">
            {/* Indicador de Afinidad Astrológica */}
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-purple-400 font-semibold">
                Destinos Astrales
              </span>
              <span className="bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs px-3 py-1 rounded-full font-bold">
                88% Afinidad
              </span>
            </div>

            {/* Datos del Perfil */}
            <div>
              <h2 className="text-3xl font-bold font-serif text-white">{currentProfile.name}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {currentProfile.birth?.date} · Caracas, Venezuela
              </p>
              <p className="text-sm text-slate-300 mt-3 italic">"{currentProfile.bio}"</p>
            </div>

            {/* Tríada del Perfil */}
            <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Sol</span>
                <span className="text-xs font-bold text-rose-400">{currentProfile.chart?.triad?.sun?.sign || "Aries"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Luna</span>
                <span className="text-xs font-bold text-purple-400">{currentProfile.chart?.triad?.moon?.sign || "Leo"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Ascendente</span>
                <span className="text-xs font-bold text-rose-300">{currentProfile.chart?.triad?.asc?.sign || "Escorpio"}</span>
              </div>
            </div>

            {/* Botones de Swipe / Interacción */}
            <div className="flex items-center justify-center gap-6 pt-2">
              <button
                onClick={() => handleSwipe("pass")}
                className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 text-xl font-bold flex items-center justify-center transition active:scale-90 shadow-lg cursor-pointer"
              >
                ✕
              </button>
              <button
                onClick={() => handleSwipe("like")}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xl font-bold flex items-center justify-center transition active:scale-90 shadow-lg cursor-pointer"
              >
                ♥
              </button>
            </div>

            {/* Animación de Match y Redirección */}
            {matchAnimation && (
              <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <span className="text-4xl">✨</span>
                <h3 className="text-2xl font-bold font-serif text-white">¡Sincronía Cósmica!</h3>
                <p className="text-xs text-rose-200">
                  Redirigiendo al chat con {currentProfile.name}...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <span className="text-4xl">🌌</span>
            <h3 className="text-xl font-bold font-serif text-white">Has visto todas las almas disponibles</h3>
            <p className="text-xs text-slate-400">
              Vuelve más tarde para descubrir nuevas conexiones astrales.
            </p>
            <button
              onClick={() => setCurrentIndex(0)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-xl hover:bg-slate-700 transition cursor-pointer"
            >
              Reiniciar exploración
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
