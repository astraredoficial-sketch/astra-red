"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CartaPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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

  const chartData = profile?.chart || {};
  const triad = chartData?.triad || {};

  const sunSign = triad?.sun?.sign || chartData?.sun || "Sagitario";
  const moonSign = triad?.moon?.sign || chartData?.moon || "Acuario";
  const ascSign = triad?.asc?.sign || chartData?.asc || "Capricornio";

  const locationText = [profile?.location_city, profile?.location_country]
    .filter(Boolean)
    .join(", ") || "Barinas, Venezuela";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AppNav active="carta" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
              🧙‍♂️
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
                  {profile?.name || "Aaron Montilla"}
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

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="w-56 h-56 rounded-full border border-dashed border-rose-500/40 flex flex-col items-center justify-center relative bg-slate-950/40 backdrop-blur-sm shadow-inner">
            <span className="text-4xl mb-2">✨</span>
            <span className="text-xl font-serif font-bold text-amber-300">{sunSign}</span>
            <span className="text-xs text-slate-400 tracking-widest uppercase mt-1">ASC {ascSign}</span>
          </div>

          <p className="text-xs text-slate-400 max-w-md">
            Calculado con base en las coordenadas exactas de <strong className="text-white">{locationText}</strong> para <strong className="text-white">{profile?.name || "Aaron Montilla"}</strong>.
          </p>
        </div>

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
      </main>
    </div>
  );
}
