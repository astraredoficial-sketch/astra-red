"use client";

import React, { useState, useRef, useEffect } from "react";

export type CountryOption = {
  name: string;
  code: string;
  iso: string;
};

export const COUNTRIES: CountryOption[] = [
  { name: "Venezuela", code: "+58", iso: "ve" },
  { name: "Colombia", code: "+57", iso: "co" },
  { name: "México", code: "+52", iso: "mx" },
  { name: "Argentina", code: "+54", iso: "ar" },
  { name: "España", code: "+34", iso: "es" },
  { name: "Estados Unidos", code: "+1", iso: "us" },
  { name: "Chile", code: "+56", iso: "cl" },
  { name: "Perú", code: "+51", iso: "pe" },
  { name: "Ecuador", code: "+593", iso: "ec" },
  { name: "Dominicana", code: "+1809", iso: "do" },
];

interface Props {
  selectedCode: string;
  onChange: (code: string) => void;
}

export function CountryCodeSelect({ selectedCode, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find((c) => c.code === selectedCode) || COUNTRIES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Botón principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-pointer text-sm font-medium focus:outline-none focus:border-rose-500 hover:border-slate-700 transition"
      >
        <img
          src={"https://flagcdn.com/w40/" + selected.iso + ".png"}
          alt={selected.name}
          className="w-5 h-3.5 object-cover rounded-sm"
        />
        <span>{selected.code}</span>
        <span className="text-xs text-slate-400 ml-1">▾</span>
      </button>

      {/* Menú desplegable personalizado con banderas reales */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {COUNTRIES.map((c) => (
            <button
              key={c.iso + "-" + c.code}
              type="button"
              onClick={() => {
                onChange(c.code);
                setIsOpen(false);
              }}
              className={
                "w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-slate-800 transition " +
                (selected.code === c.code ? "bg-rose-950/40 text-rose-400 font-semibold" : "text-slate-200")
              }
            >
              <img
                src={"https://flagcdn.com/w40/" + c.iso + ".png"}
                alt={c.name}
                className="w-5 h-3.5 object-cover rounded-sm shrink-0"
              />
              <span>{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
