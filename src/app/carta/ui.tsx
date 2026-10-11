"use client";

import React, { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export default function CartaUi() {
  const [profile, setProfile] = useState<any>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAuthUser(user);
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  // Extraer nombre real del usuario autenticado actual
  const userName = 
    profile?.name || 
    profile?.full_name || 
    authUser?.user_metadata?.full_name || 
    authUser?.user_metadata?.name || 
    (authUser?.email ? authUser.email.split("@")[0] : "Explorador Astral");

  const chartData = profile?.chart || {};
  const triad = chartData?.triad || {};

  const sunSign = triad?.sun?.sign || chartData?.sun || "Pendiente";
  const moonSign = triad?.moon?.sign || chartData?.moon || "Pendiente";
  const ascSign = triad?.asc?.sign || chartData?.asc || "Pendiente";

  const locationText = [profile?.location_city, profile?.location_country]
    .filter(Boolean)
    .join(", ") || "Universo Sincronizado";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <AppNav active="carta" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-amber-400 animate-pulse font-serif text-lg">✦ Consultando tu firmamento... ✦</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AppNav active="carta" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Banner de perfil dinámico del usuario actual */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
              🧙‍♂️
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-serif font-bold text-white tracking-wide capitalize">
                  {userName}
                </h1>
                <span className="bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  🌱 PLAN FREE
                </span>
              </div>
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                📍 <span>{locationText}</span>
                <span className="text-slate-500 mx-1">•</span>
                <span className="text-slate-400">Universo privado sincronizado y protegido.</span>
              </p>
            </div>
          </div>

          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow">
            Compartir Carta
          </button>
        </div>

        {/* Círculo Astral Central */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="w-48 h-48 rounded-full border border-dashed border-amber-500/40 flex flex-col items-center justify-center relative bg-slate-950/50 backdrop-blur-sm shadow-inner">
            <span className="text-3xl mb-1">✨</span>
            <span className="text-lg font-serif font-bold text-amber-300">Sol en {sunSign}</span>
            <span className="text-xs text-slate-400 tracking-widest uppercase mt-1">ASC {ascSign}</span>
          </div>

          <p className="text-xs text-slate-400 max-w-md">
            Carta Natal calculada con base en los registros astrológicos de <strong className="text-white capitalize">{userName}</strong>.
          </p>
        </div>

        {/* Tríada Astral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-2 hover:border-amber-500/30 transition shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <span>☀️</span> SOL
            </div>
            <div className="text-xl font-bold text-white">{sunSign}</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Esencia, vitalidad y propósito de vida en el firmamento.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-2 hover:border-purple-500/30 transition shadow-lg">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
              <span>🌙</span> LUNA
            </div>
            <div className="text-xl font-bold text-white">{moonSign}</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mundo emocional, intuición y refugio privado.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-2 hover:border-rose-500/30 transition shadow-lg">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <span>🌅</span> ASCENDENTE
            </div>
            <div className="text-xl font-bold text-white">{ascSign}</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Máscara social, proyección externa y aprendizaje de vida.
            </p>
          </div>
        </div>

        {/* Resumen de Vida */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-1 pb-4 border-b border-slate-800">
            <h2 className="text-xl font-serif font-bold text-amber-300 tracking-wide">
              ✦ RESUMEN DE VIDA ✦
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest">
              Interpretación Astrológica y Claves Vitales
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span>🔮</span> Perfil & Vocación
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li><strong className="text-white">Sol en {sunSign}:</strong> Liderazgo natural, enfoque expansivo y búsqueda constante de conocimiento.</li>
                <li><strong className="text-white">Luna en {moonSign}:</strong> Profundidad emocional, originalidad y necesidad de libertad interior.</li>
                <li><strong className="text-white">Ascendente {ascSign}:</strong> Disciplina, estructura y proyección única hacia el exterior.</li>
              </ul>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <span>⚡</span> Reto de Vida
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <li><strong className="text-white">Tránsitos Activos:</strong> Encontrar el equilibrio perfecto entre la flexibilidad creativa y la alta exigencia.</li>
                <li><strong className="text-white">Lecciones Clave:</strong> Autenticidad, resiliencia y consolidación de proyectos a largo plazo.</li>
              </ul>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <span>🌟</span> Destino & Vocación
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Camino enfocado en integrar la técnica, el arte y la guía personal con un propósito elevado y transformador.
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span>💖</span> Amor & Relaciones
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vínculos basados en la lealtad, la complicidad intelectual y el respeto mutuo por los espacios de crecimiento.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
