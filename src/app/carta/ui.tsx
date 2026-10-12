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
    <div className="flex min-h-screen flex-col bg-[#080d1b] text-slate-100">
      <AppNav active="carta" />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:py-12">
        <article className="relative overflow-hidden rounded-[2rem] bg-[#efe4c7] p-2 text-[#18243a] shadow-[0_30px_100px_rgba(0,0,0,0.4)] sm:p-3">
          <div className="pointer-events-none absolute inset-2 rounded-[1.55rem] border border-[#a88648]/70 sm:inset-3" />
          <div className="pointer-events-none absolute inset-4 rounded-[1.35rem] border border-[#a88648]/25 sm:inset-5" />

          <span aria-hidden="true" className="pointer-events-none absolute left-6 top-5 font-serif text-3xl text-[#a88648]/80 sm:left-9 sm:top-8">✦</span>
          <span aria-hidden="true" className="pointer-events-none absolute right-6 top-5 font-serif text-3xl text-[#a88648]/80 sm:right-9 sm:top-8">✧</span>
          <span aria-hidden="true" className="pointer-events-none absolute bottom-5 left-6 font-serif text-3xl text-[#a88648]/80 sm:bottom-8 sm:left-9">✧</span>
          <span aria-hidden="true" className="pointer-events-none absolute bottom-5 right-6 font-serif text-3xl text-[#a88648]/80 sm:bottom-8 sm:right-9">✦</span>

          <div className="relative mx-auto max-w-5xl px-5 py-10 sm:px-12 sm:py-14">
            <header className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#92733b] sm:text-xs">
                ✦ &nbsp; Tu mapa celeste personal &nbsp; ✦
              </p>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-[#101a2b] sm:text-6xl">
                Carta natal
              </h1>
              <p className="mt-2 break-words font-serif text-2xl capitalize text-[#35435a] sm:text-3xl">
                {me.name}
              </p>
              <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-[0.14em] text-[#5d6470] sm:text-sm">
                <span>{me.locationCity}, {me.locationCountry}</span>
                <span aria-hidden="true" className="text-[#a88648]">✦</span>
                <span>{chart.triad.sun.sign} · {chart.triad.moon.sign} · {chart.triad.asc.sign}</span>
              </div>
              <div aria-hidden="true" className="mx-auto mt-6 flex max-w-xs items-center gap-3 text-[#a88648]">
                <span className="h-px flex-1 bg-[#a88648]/50" />
                <span className="text-lg">☼</span>
                <span className="h-px flex-1 bg-[#a88648]/50" />
              </div>
            </header>

            <section aria-label="Rueda de tu carta natal" className="mx-auto mt-8 max-w-2xl">
              <ChartWheel
                chart={chart}
                className="mx-auto w-full max-w-[560px] drop-shadow-[0_18px_32px_rgba(22,31,50,0.28)]"
              />
              <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-[#897344]">
                Círculo zodiacal · casas astrológicas
              </p>
            </section>

            <section className="mx-auto mt-9 max-w-3xl">
              <h2 className="text-center font-serif text-3xl font-semibold text-[#17233a] sm:text-4xl">
                Tu esencia astral
              </h2>
              <p className="mt-1 text-center text-xs uppercase tracking-[0.26em] text-[#947844]">
                Sol · Luna · Ascendente
              </p>
              <div className="mt-5">
                <Triad chart={chart} />
              </div>
              <p className="mx-auto mt-7 max-w-2xl whitespace-pre-line text-center font-serif text-lg leading-8 text-[#3f4753] sm:text-xl">
                {generateLifeSummary(chart)}
              </p>
              {chart.timeUnknown && (
                <p className="mx-auto mt-6 max-w-2xl border-t border-[#a88648]/30 pt-4 text-center text-xs leading-5 text-[#64676d]">
                  La hora de nacimiento no estaba disponible y se utilizó el mediodía. El ascendente y las casas pueden variar.
                </p>
              )}
            </section>
          </div>
        </article>

        <section className="rounded-3xl border border-[#c9a964]/25 bg-[#10182a] p-5 shadow-xl sm:p-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#d2b675]">Tu mapa en detalle</p>
              <h2 className="mt-2 font-serif text-3xl text-[#f2e5c6]">Planetas, signos y casas</h2>
            </div>
            <p className="text-sm text-slate-400">La posición de cada punto de tu carta.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#c9a964]/20">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-[#18243a] text-xs uppercase tracking-wider text-[#d2b675]">
                <tr>
                  <th className="px-4 py-3">Punto</th>
                  <th className="px-4 py-3">Signo</th>
                  <th className="px-4 py-3">Grado</th>
                  <th className="px-4 py-3">Casa</th>
                </tr>
              </thead>
              <tbody>
                {chart.planets.map((planet) => (
                  <tr key={planet.id} className="border-t border-white/5 bg-[#0c1322]">
                    <th className="px-4 py-3 font-medium text-[#f2e5c6]">
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

        <section className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#d2b675]">Lectura astral</p>
            <h2 className="mt-2 font-serif text-3xl text-[#f2e5c6]">Los símbolos de tu cielo</h2>
            <p className="mt-1 text-sm text-slate-400">
              Interpretaciones generadas desde las posiciones calculadas de tu carta.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {readings.map((reading) => (
              <article
                key={reading.planet}
                className="rounded-2xl border border-[#c9a964]/20 bg-[#10182a] p-5"
              >
                <h3 className="font-semibold text-[#e4c77f]">
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
