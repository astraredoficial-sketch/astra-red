"use client";

import { Country, City } from 'country-state-city';
import React, { useEffect, useState } from "react";
import { getAllAccounts, saveAccounts } from "@/lib/userStore";
import { supabase } from "@/lib/supabase/client";



export function OnboardingUi() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [availableCities, setAvailableCities] = useState<Array<{ name: string; countryCode?: string; stateCode?: string }>>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [lookingFor, setLookingFor] = useState("");
  const [targetGender, setTargetGender] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getSession();
      setAuthUserId(data.session?.user.id ?? null);
    }

    void loadUser();
  }, []);

  const countries = Country.getAllCountries();
  function handleCountryChange(countryCode: string) {
    setSelectedCountry(countryCode);
    const cities = City.getCitiesOfCountry(countryCode) || [];
    setAvailableCities(cities);
    setSelectedCity("");
  }

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    const accounts = getAllAccounts();

    // Si hay una cuenta actual o creamos una nueva
    const currentAcc = accounts.find(a => a.isCurrent) || accounts[0];

    const updated = accounts.map(acc => {
      if (acc.id === currentAcc.id) {
        return {
          ...acc,
          name: name.trim() || acc.name,
          email: email.trim() || acc.email,
          password: password || acc.password,
          location_country: selectedCountry,
          location_city: selectedCity,
          birth_date: birthDate,
          birth_time: birthTime,
          birth_time_unknown: birthTimeUnknown,
          looking_for: lookingFor,
          target_gender: targetGender,
          isComplete: true, // ¡Registro completado con éxito!
        };
      }
      return acc;
    });

    saveAccounts(updated);

    if (authUserId) {
      await supabase
        .from("profiles")
        .upsert({
          id: authUserId,
          name: name.trim() || currentAcc.name,
          location_country: selectedCountry,
          location_city: selectedCity,
          birth_date: birthDate,
          birth_time: birthTime,
          birth_time_unknown: birthTimeUnknown,
          looking_for: lookingFor,
          target_gender: targetGender,
        });
    }

    window.location.href = "/cuenta";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
        
        {/* Indicador de pasos */}
        <div className="flex justify-between items-center text-xs text-purple-400 font-bold uppercase tracking-widest font-mono">
          <span>Paso {step} de 3</span>
          <span>AstraRed Onboarding</span>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">¿Cómo te llamas?</h1>
            <p className="text-xs text-slate-400">Personaliza tu identidad en tu universo privado.</p>
            
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Nombre completo</label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Pacheco"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <button
              type="button"
              onClick={() => { if(name.trim()) setStep(2); else alert("Por favor ingresa tu nombre."); }}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-extrabold rounded-2xl transition shadow-xl text-sm cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        )}

    {step === 2 && (
          <form onSubmit={handleFinish} className="space-y-4 animate-in fade-in">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">¿Dónde naciste?</h1>
            <p className="text-xs text-slate-400">Selecciona tu ciudad natal para calcular efemérides y carta natal con precisión.</p>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">Fecha de nacimiento:</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">Hora de nacimiento:</label>
              <input
                type="time"
                value={birthTime}
                disabled={birthTimeUnknown}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={birthTimeUnknown}
                onChange={(e) => setBirthTimeUnknown(e.target.checked)}
              />
              No conozco mi hora de nacimiento
            </label>
            <div className="space-y-2">
              <label className="block text-xs text-slate-300">País:</label>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
              >
                <option value="">Selecciona un país</option>
                {countries.map((country) => (
                  <option key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-300">Ciudad:</label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                }}
                disabled={!selectedCountry}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
              >
                <option value="">Selecciona una ciudad</option>
                {availableCities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition text-xs"
              >
                Atrás
              </button>
              <button
                  type="button"
                onClick={() => setStep(3)}
              >
                  Siguiente
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleFinish} className="space-y-4 animate-in fade-in">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">Preferencias</h1>
            <p className="text-xs text-slate-400">Cuéntanos qué tipo de conexión buscas.</p>
        <div className="space-y-2">
          <label className="block text-xs text-slate-300">¿Qué buscas?</label>
          <select
            value={lookingFor}
            onChange={(e) => setLookingFor(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
          >
            <option value="">Selecciona una opción</option>
            <option value="amistad">Amistad</option>
            <option value="relacion">Relación</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs text-slate-300">¿Con quién te interesa conectar?</label>
          <select
            value={targetGender}
            onChange={(e) => setTargetGender(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white"
          >
            <option value="">Selecciona una opción</option>
            <option value="hombres">Hombres</option>
            <option value="mujeres">Mujeres</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition text-xs"
          >
            Atrás
          </button>

            <button
              type="submit"
          >
            Finalizar registro
          </button>
        </div>
      </form>
    )}
      </div>
    </div>
  );
}



















































