"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { ChartWheel } from "@/components/ChartWheel";
import { Triad } from "@/components/Triad";
import { useSession } from "@/hooks/useSession";
import { generateLifeSummary, generatePlanetReadings } from "@/lib/astro/interpreter";
import { PLANET_META } from "@/lib/astro/constants";

export default function CartaUi() {
  const router = useRouter();
  const { ready, store, me, error } = useSession();

  useEffect(() => {
    if (!ready || error || me) return;
    router.replace(store?.currentUserId ? "/onboarding" : "/acceso?mode=login");
  }, [error, me, ready, router, store?.currentUserId]);

  if (!ready || (!me && !error)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-amber-300">
        Consultando tu firmamento...
      </div>
    );
  }

  if (error || !me) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center">
        <p role="alert" className="max-w-xl text-sm leading-6 text-rose-300">
          {error || "No encontramos tu perfil. Completa el registro para crear tu carta."}
        </p>
      </main>
    );
  }

  const chart = me.chart;
  const readings = generatePlanetReadings(chart);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <AppNav active="carta" />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        <header className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-rose-400">
              Tu carta natal
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold capitalize">
              {me.name}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {me.locationCity}, {me.locationCountry}
            </p>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-400">
            Posiciones calculadas para la fecha, hora y ciudad que indicaste.
            {chart.timeUnknown &&
              " Al desconocer la hora, usamos el mediodía; el ascendente y las casas pueden variar."}
          </p>
        </header>

        <section className="grid items-center gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-8 md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <h2 className="font-serif text-2xl">Tu tríada astral</h2>
            <Triad chart={chart} />
            <p className="whitespace-pre-line text-sm leading-6 text-slate-400">
              {generateLifeSummary(chart)}
            </p>
          </div>
          <ChartWheel
            chart={chart}
            className="mx-auto w-full max-w-[320px]"
          />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl">Planetas, signos y casas</h2>
            <p className="mt-1 text-sm text-slate-400">
              La posición de cada punto de tu carta natal.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-900 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Punto</th>
                  <th className="px-4 py-3">Signo</th>
                  <th className="px-4 py-3">Grado</th>
                  <th className="px-4 py-3">Casa</th>
                </tr>
              </thead>
              <tbody>
                {chart.planets.map((planet) => (
                  <tr
                    key={planet.id}
                    className="border-t border-slate-800 bg-slate-950/50"
                  >
                    <th className="px-4 py-3 font-medium text-white">
                      {PLANET_META[planet.id].name}
                    </th>
                    <td className="px-4 py-3 text-slate-300">{planet.sign}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {planet.degreeInSign.toFixed(2)}°
                    </td>
                    <td className="px-4 py-3 text-slate-300">{planet.house}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-2xl">Lectura de tu carta</h2>
            <p className="mt-1 text-sm text-slate-400">
              Interpretaciones generadas desde las posiciones calculadas.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {readings.map((reading) => (
              <article
                key={reading.planet}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <h3 className="font-semibold text-amber-300">
                  {reading.title} · {reading.sign}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {reading.interpretation}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
