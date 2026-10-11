"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export default function OnboardingUi() {
  const router = useRouter();
  const [step, setStep] = useState(3);
  const [loading, setLoading] = useState(false);
  const [lookingFor, setLookingFor] = useState("Amistad");
  const [genderPref, setGenderPref] = useState("Mujeres");

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").upsert({
            id: user.id,
            looking_for: lookingFor,
            gender_preference: genderPref,
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error("Error guardando onboarding:", err);
    } finally {
      setLoading(false);
      // Redirección directa y garantizada a la Carta Natal
      router.push("/carta");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="flex items-center justify-between text-xs tracking-widest text-slate-400 font-bold uppercase">
          <span>PASO {step} DE 3</span>
          <span className="text-purple-400">ASTRARED ONBOARDING</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-serif font-bold text-white">Preferencias</h1>
          <p className="text-xs text-slate-400">Cuéntanos qué tipo de conexión buscas.</p>
        </div>

        <form onSubmit={handleFinish} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">¿Qué buscas?</label>
            <select
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Amistad">Amistad</option>
              <option value="Amor">Amor</option>
              <option value="Conexión Astral">Conexión Astral</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">¿Con quién te interesa conectar?</label>
            <select
              value={genderPref}
              onChange={(e) => setGenderPref(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Mujeres">Mujeres</option>
              <option value="Hombres">Hombres</option>
              <option value="Todos">Todos</option>
            </select>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold py-3 rounded-xl transition"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50"
            >
              {loading ? "Calculando..." : "Crear mi carta natal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
