"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { HiloRojo } from "@/components/HiloRojo";
import { useSession } from "@/hooks/useSession";
import { ASPECT_META, PLANET_META } from "@/lib/astro/constants";
import { computeSynastry } from "@/lib/astro/synastry";
import { supabase } from "@/lib/supabase/client";

export function ConectarUi() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, store, me, error: sessionError } = useSession();

  const other = useMemo(
    () => store?.profiles.find((profile) => profile.id === (params?.id ?? "")),
    [params?.id, store],
  );
  const syn = me && other ? computeSynastry(me.chart, other.chart) : null;
  const [isMatch, setIsMatch] = useState(false);
  const [matchError, setMatchError] = useState("");

  useEffect(() => {
    if (!ready || sessionError || me) return;
    router.replace(store?.currentUserId ? "/onboarding" : "/acceso?mode=login");
  }, [me, ready, router, sessionError, store?.currentUserId]);

  useEffect(() => {
    if (!me || !other) return;
    let active = true;
    const currentUser = me;
    const currentOther = other;
    const [userA, userB] = [currentUser.id, currentOther.id].sort();

    async function checkMatch() {
      const { data, error } = await supabase
        .from("matches")
        .select("user_a")
        .eq("user_a", userA)
        .eq("user_b", userB)
        .maybeSingle();

      if (!active) return;
      if (error) {
        setMatchError(`No se pudo comprobar la conexión: ${error.message}`);
        return;
      }
      setIsMatch(Boolean(data));
    }

    void checkMatch();
    return () => {
      active = false;
    };
  }, [me, other]);

  if (!ready || !me) {
    return (
      <div className="grid flex-1 place-items-center text-muted">
        {sessionError || "Tejiendo aspectos..."}
      </div>
    );
  }

  if (!other || !syn) {
    return (
      <div className="grid flex-1 place-items-center">
        <p className="text-muted">No encontramos ese destino.</p>
        <Link href="/destinos" className="mt-3 text-thread">
          Volver al feed
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {syn.hiloRojo && (
          <div className="pointer-events-none absolute inset-0">
            <HiloRojo show />
          </div>
        )}
        <section className="relative z-[1] overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(ellipse_at_top_right,rgba(138,43,226,0.16),transparent_48%),linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025)_55%,rgba(255,42,95,0.06))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-astral">
              Lectura de sinastría
            </p>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-muted">
              {syn.aspects.length} {syn.aspects.length === 1 ? "aspecto" : "aspectos"}
            </span>
          </div>

          <h1 className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-serif text-4xl leading-tight text-white sm:text-5xl">
            <span>{me.name}</span>
            <span aria-hidden="true" className="text-2xl text-thread sm:text-3xl">×</span>
            <span>{other.name}</span>
          </h1>

          <div className="mt-7 grid gap-6 rounded-3xl border border-white/10 bg-[#090711]/55 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-7">
            <div
              className={`grid h-28 w-28 place-items-center rounded-full border ${
                syn.hiloRojo
                  ? "border-thread/45 bg-thread/10 shadow-[0_0_38px_rgba(255,42,95,0.18)]"
                  : "border-astral/40 bg-astral/10 shadow-[0_0_38px_rgba(138,43,226,0.18)]"
              }`}
            >
              <div className="text-center">
                <span className="block font-serif text-5xl leading-none text-white">{syn.percent}</span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.17em] text-muted">
                  afinidad
                </span>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-2xl text-white">Su conexión astral</h2>
                {syn.hiloRojo && (
                  <span className="rounded-full border border-thread/30 bg-thread/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-thread">
                    Hilo Rojo activo
                  </span>
                )}
              </div>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-label="Porcentaje de afinidad"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={syn.percent}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ${
                    syn.hiloRojo
                      ? "bg-gradient-to-r from-[#ff476f] to-[#ff9aad]"
                      : "bg-gradient-to-r from-[#8a2be2] to-[#d5a5ff]"
                  }`}
                  style={{ width: `${syn.percent}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">
                {syn.hiloRojo
                  ? "Una afinidad excepcional y contactos con el Nodo Norte mantienen activo el Hilo Rojo."
                  : syn.hasNodalAspect
                    ? "Hay contacto nodal entre ambas cartas; el umbral para activar el Hilo Rojo aún no se alcanza."
                    : "Esta lectura reúne los aspectos entre ambas cartas. El Hilo Rojo requiere más del 90% de afinidad y contacto nodal."}
              </p>
              {syn.timeApproximate && (
                <p className="mt-2 text-xs leading-5 text-amber-200/80">
                  Una o ambas horas de nacimiento son desconocidas; no se
                  incluyen los aspectos de Luna ni Ascendente en esta
                  compatibilidad.
                </p>
              )}
            </div>
          </div>
        </section>

        <section aria-labelledby="aspects-title" className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">
                Mapa de compatibilidad
              </p>
              <h2 id="aspects-title" className="mt-1 font-serif text-3xl text-white">
                Aspectos exactos
              </h2>
            </div>
            <span className="pb-1 text-xs text-muted">Ordenados por influencia</span>
          </div>

          <ul className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
            {syn.aspects.map((a, i) => (
              <li
                key={`${a.a}-${a.b}-${i}`}
                className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-4 last:border-b-0 sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-astral/20 bg-astral/10 text-[10px] font-semibold tracking-wide text-[#d9b8ff]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate text-sm font-medium text-ink sm:text-base">
                    {PLANET_META[a.a].name}{" "}
                    <span className="text-muted">{ASPECT_META[a.type].name}</span>{" "}
                    {PLANET_META[a.b].name}
                  </span>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-muted">
                  orbe <span className="font-medium text-white">{a.orb}°</span>
                </span>
              </li>
            ))}
            {syn.aspects.length === 0 && (
              <li className="flex items-center gap-3 px-5 py-6 text-sm text-muted">
                <span aria-hidden="true" className="text-xl text-astral">✦</span>
                Aún no hay aspectos mayores exactos entre estas cartas.
              </li>
            )}
          </ul>
        </section>

        {matchError && (
          <p role="alert" className="mt-6 text-sm text-rose-300">
            {matchError}
          </p>
        )}
        {!isMatch && (
          <p className="mt-7 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-center text-sm leading-6 text-muted">
            Para chatear, ambos deben indicar que les gusta el perfil.
          </p>
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/destinos"
            className="rounded-full border border-white/15 bg-white/[0.035] py-3 text-center text-sm text-ink/80 transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
          >
            Volver a destinos
          </Link>
          {isMatch && (
            <Link
              href={`/mensajes/${other.id}`}
              className="glow-thread rounded-full bg-thread py-3 text-center text-sm font-medium text-white transition hover:brightness-110"
            >
              Continuar conversación
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
