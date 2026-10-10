"use client";

import React, { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { AppNav } from "@/components/AppNav";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";
import { saveStore } from "@/lib/storage";

export function PerfilUi() {
  const { me, setMe } = useSession();

  const [name, setName] = useState(me?.name || "Aaron Montilla");
  const [bio, setBio] = useState(me?.bio || "Atento y amante de la música");
  const [countryCode, setCountryCode] = useState(me?.phone?.countryCode || "+58");
  const [phoneNumber, setPhoneNumber] = useState(me?.phone?.number || "4140547234");
  const [whatsappAlerts, setWhatsappAlerts] = useState(me?.phone?.whatsappAlerts ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;

    const updated = {
      ...me,
      name,
      bio,
      phone: {
        countryCode,
        number: phoneNumber,
        whatsappAlerts,
      },
    };

    setMe(updated);
    saveStore({ me: updated, profiles: [] });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <AppNav active="perfil" />

      <main className="max-w-xl mx-auto p-6 space-y-6 w-full flex-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-serif text-white">Tu Perfil Astral</h1>
          <p className="text-xs text-slate-400">
            Personaliza cómo te presentas y administra tus preferencias de contacto.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          {/* Avatar y Foto */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 font-bold text-2xl shadow-lg">
              {name.charAt(0)}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">{name}</h3>
              <p className="text-[10px] text-slate-400">JPG, PNG o WebP · máximo 5 MB</p>
              <div className="flex items-center gap-2 pt-1">
                <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition border border-slate-700">
                  Subir foto
                </button>
                <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition border border-slate-700">
                  Tomar foto
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Descripción</label>
              <textarea
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition resize-none"
              />
              <span className="text-[10px] text-slate-500 text-right block">{bio.length}/500</span>
            </div>

            {/* Teléfono con prefijo internacional */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Teléfono con prefijo internacional</label>
              <div className="flex gap-2">
                <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Selecciona el país de tu línea telefónica para poder recibir alertas por WhatsApp.
              </p>
            </div>

            {/* Casilla de WhatsApp */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
              <input
                type="checkbox"
                id="waCheck"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsappAlerts(e.target.checked)}
                className="mt-0.5 accent-rose-600 rounded cursor-pointer"
              />
              <label htmlFor="waCheck" className="text-xs cursor-pointer space-y-0.5">
                <span className="font-bold text-white block">Acepto recibir alertas por WhatsApp</span>
                <span className="text-[10px] text-slate-400 block leading-relaxed">
                  Es opcional. Puedes retirar tu consentimiento desmarcando esta casilla.
                </span>
              </label>
            </div>

            {savedSuccess && (
              <p className="text-emerald-400 text-xs text-center font-semibold animate-in fade-in">
                ✓ Cambios guardados correctamente
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-sm transition shadow-lg active:scale-98 cursor-pointer"
            >
              Guardar cambios
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
