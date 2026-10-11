"use client";

import { useMemo, useState } from "react";
import { searchCities, type City } from "@/lib/cities";

export function CitySearch({
  value,
  onChange,
}: {
  value: City | null;
  onChange: (city: City) => void;
}) {
  const [q, setQ] = useState(value ? `${value.name}, ${value.country}` : "");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchCities(q), [q]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Escribe tu ciudad de nacimiento"
        className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none ring-thread/40 placeholder:text-muted/70 focus:ring-2"
      />
      {open && (
        <ul className="absolute z-10 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-white/10 bg-[#120c1c] shadow-2xl">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-astral/25"
                onClick={() => {
                  onChange(c);
                  setQ(`${c.name}, ${c.country}`);
                  setOpen(false);
                }}
              >
                <span className="text-ink">{c.name}</span>
                <span className="text-muted"> · {c.country}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">Sin resultados. Elige una ciudad de la lista.</li>
          )}
        </ul>
      )}
    </div>
  );
}

