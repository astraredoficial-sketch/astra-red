"use client";

import React from "react";
import { CountryCodeSelect } from "./CountryCodeSelect";
import type { Gender, LookingFor, TargetGender, PhoneData } from "@/lib/types";

interface Props {
  phone: PhoneData;
  gender: Gender;
  lookingFor: LookingFor;
  targetGender: TargetGender;
  onChangePhone: (phone: PhoneData) => void;
  onChangeGender: (gender: Gender) => void;
  onChangeLookingFor: (lookingFor: LookingFor) => void;
  onChangeTargetGender: (targetGender: TargetGender) => void;
}

export function PreferencesFormGroup({
  phone,
  gender,
  lookingFor,
  targetGender,
  onChangePhone,
  onChangeGender,
  onChangeLookingFor,
  onChangeTargetGender,
}: Props) {
  return (
    <div className="space-y-6 text-left">
      {/* Campo WhatsApp */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Teléfono WhatsApp (Solo para alarmas de calendarios astrales)
        </label>
        <div className="flex gap-2">
          <CountryCodeSelect
            selectedCode={phone.countryCode}
            onChange={(code) => onChangePhone({ ...phone, countryCode: code })}
          />
          <input
            type="tel"
            placeholder="4121234567"
            value={phone.number}
            onChange={(e) => onChangePhone({ ...phone, number: e.target.value })}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
            required
          />
        </div>
        <p className="text-xs text-slate-400">
          🔒 Tu teléfono no se mostrará públicamente. Se usará únicamente para enviarte notificaciones de tu calendario natal.
        </p>
      </div>

      {/* Mi Género */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Soy:</label>
        <div className="grid grid-cols-3 gap-2">
          {(["hombre", "mujer", "otro"] as Gender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChangeGender(g)}
              className={py-2 text-sm rounded-lg border capitalize transition  +
                (gender === g
                  ? "bg-rose-600 border-rose-500 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500")}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Intención de Búsqueda */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Busco conseguir:</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "amistad", label: "Amistad" },
            { id: "pareja", label: "Pareja" },
            { id: "ambos", label: "Ambos" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeLookingFor(item.id as LookingFor)}
              className={py-2 text-sm rounded-lg border transition  +
                (lookingFor === item.id
                  ? "bg-rose-600 border-rose-500 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preferencia de Género a Conectar */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Me interesa ver:</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "hombre", label: "Hombres" },
            { id: "mujer", label: "Mujeres" },
            { id: "ambos", label: "Todos" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTargetGender(item.id as TargetGender)}
              className={py-2 text-sm rounded-lg border transition  +
                (targetGender === item.id
                  ? "bg-rose-600 border-rose-500 text-white"
                  : "border-slate-700 text-slate-400 hover:border-slate-500")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
