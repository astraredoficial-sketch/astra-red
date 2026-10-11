"use client";

import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey);
}

export default function OnboardingUi() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const [lookingFor, setLookingFor] = useState("Relación");
  const [genderPref, setGenderPref] = useState("Mujeres");

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { error } = await supabase.from("profiles").upsert({
            id: user.id,
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Usuario",
            birth_date: birthDate,
            birth_time: birthTimeUnknown ? null : birthTime,
            birth_time_unknown: birthTimeUnknown,
            location_country: country,
            location_city: city,
            looking_for: lookingFor,
            target_gender: genderPref,
            updated_at: new Date().toISOString(),
          });

          if (error) throw error;
        }
      }
    } catch (err) {
      console.error("Error guardando onboarding:", err);
    } finally {
      window.location.href = "/carta";
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">

        <div className="flex items-center justify-between text-xs tracking-widest text-slate-400 font-bold uppercase">
          <span>PASO {step} DE 3</span>
          <span className="text-purple-400">ASTRARED ONBOARDING</span>
        </div>

        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">
                Tu nacimiento
              </h1>
              <p className="text-xs text-slate-400">
                Necesitamos estos datos para calcular tu carta natal.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
              />

              <input
                type="time"
                value={birthTime}
                disabled={birthTimeUnknown}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
              />

              <label className="flex gap-2 items-center text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={birthTimeUnknown}
                  onChange={(e) => setBirthTimeUnknown(e.target.checked)}
                />
                No conozco mi hora de nacimiento
              </label>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">
                Tu ubicación
              </h1>
              <p className="text-xs text-slate-400">
                Lugar de nacimiento para calcular posiciones astrales.
              </p>
            </div>

            <div className="space-y-4">
              <input
                placeholder="País"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
              />

              <input
                placeholder="Ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white">
                Preferencias
              </h1>
              <p className="text-xs text-slate-400">
                Cuéntanos qué tipo de conexión buscas.
              </p>
            </div>

            <div className="space-y-4">
              <select
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
              >
                <option>Relación</option>
                <option>Amistad</option>
                <option>Conexión Astral</option>
              </select>

              <select
                value={genderPref}
                onChange={(e) => setGenderPref(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
              >
                <option>Mujeres</option>
                <option>Hombres</option>
                <option>Todos</option>
              </select>
            </div>
          </>
        )}

        <div className="pt-4 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl"
            >
              Atrás
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex-[2] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-[2] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl"
            >
              {loading ? "Calculando..." : "Crear mi carta natal"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}