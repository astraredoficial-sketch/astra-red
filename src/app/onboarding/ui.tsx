"use client";

import React, { useState } from "react";
import { getAllAccounts, saveAccounts } from "@/lib/userStore";

const CITIES_LIST = [
  // Venezuela
  { name: "Barinas, Barinas, Venezuela", coords: "8.6226° N, 70.2075° W" },
  { name: "Caracas, Distrito Capital, Venezuela", coords: "10.4806° N, 66.9036° W" },
  { name: "Mérida, Mérida, Venezuela", coords: "8.5983° N, 71.1450° W" },
  { name: "Maracaibo, Zulia, Venezuela", coords: "10.6427° N, 71.6125° W" },
  { name: "Valencia, Carabobo, Venezuela", coords: "10.1621° N, 68.0077° W" },
  { name: "Barquisimeto, Lara, Venezuela", coords: "10.0678° N, 69.3474° W" },
  { name: "San Cristóbal, Táchira, Venezuela", coords: "7.7669° N, 72.2250° W" },
  { name: "Puerto La Cruz, Anzoátegui, Venezuela", coords: "10.2117° N, 64.6322° W" },
  { name: "Maturín, Monagas, Venezuela", coords: "9.7456° N, 63.1832° W" },
  { name: "Ciudad Bolívar, Bolívar, Venezuela", coords: "8.1256° N, 63.5453° W" },
  // Internacionales
  { name: "Bogotá, Colombia", coords: "4.7110° N, 74.0721° W" },
  { name: "Madrid, España", coords: "40.4168° N, 3.7038° W" },
  { name: "Buenos Aires, Argentina", coords: "34.6037° S, 58.3816° W" },
  { name: "Ciudad de México, México", coords: "19.4326° N, 99.1332° W" },
  { name: "Miami, Estados Unidos", coords: "25.7617° N, 80.1918° W" },
  { name: "Santiago, Chile", coords: "33.4489° S, 70.6693° W" },
  { name: "Lima, Perú", coords: "12.0464° S, 77.0428° W" }
];

export function OnboardingUi() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Barinas, Barinas, Venezuela");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCities = CITIES_LIST.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFinish = (e: React.FormEvent) => {
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
          location: selectedLocation,
          isComplete: true, // ¡Registro completado con éxito!
        };
      }
      return acc;
    });

    saveAccounts(updated);
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
                placeholder="Ej. Aaron Montilla"
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
          <div className="space-y-4 animate-in fade-in">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">Credenciales de acceso</h1>
            <p className="text-xs text-slate-400">Configura tu correo y contraseña segura.</p>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Correo electrónico</label>
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Contraseña</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition text-xs"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => { if(email && password) setStep(3); else alert("Completa correo y contraseña."); }}
                className="w-2/3 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-extrabold rounded-2xl transition text-xs shadow-xl"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleFinish} className="space-y-4 animate-in fade-in">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">¿Dónde naciste?</h1>
            <p className="text-xs text-slate-400">Selecciona tu ciudad natal para calcular efemérides y carta natal con precisión.</p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Buscar ciudad o país:</label>
              <input
                type="text"
                placeholder="Escribe para filtrar (ej. Barinas, Caracas...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-950/60 border border-slate-800 rounded-2xl p-2">
              {filteredCities.map((city, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedLocation(city.name)}
                  className="p-2.5 rounded-xl text-xs cursor-pointer transition flex justify-between items-center"
                >
                  <span>{city.name}</span>
                  <span className="text-[10px] text-purple-400 font-mono">{city.coords}</span>
                </div>
              ))}
              {filteredCities.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-3">No se encontraron ciudades con ese nombre.</p>
              )}
            </div>

            <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl text-xs text-purple-200">
              📍 Ubicación seleccionada: <strong className="text-white">{selectedLocation}</strong>
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
                className="w-2/3 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 text-slate-950 font-black rounded-2xl transition text-xs shadow-xl uppercase tracking-wider cursor-pointer"
              >
                Generar mi carta natal
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
