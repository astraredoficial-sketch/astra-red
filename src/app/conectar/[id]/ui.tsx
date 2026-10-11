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
    () => store?.profiles.find((profile) => profile.id === params.id),
    [params.id, store],
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
      <main className="relative mx-auto w-full max-w-lg px-4 py-8">
        {syn.hiloRojo && (
          <div className="pointer-events-none absolute inset-0">
            <HiloRojo show />
          </div>
        )}
        <p className="text-xs uppercase tracking-[0.3em] text-astral">Templo de sinastrÃ­a</p>
        <h1 className="font-serif text-4xl">
          {me.name} <span className="text-thread">Ã—</span> {other.name}
        </h1>
        <div
          className={`mt-6 inline-flex items-baseline gap-2 rounded-full px-5 py-2 ${
            syn.hiloRojo ? "bg-thread glow-thread" : "bg-astral/80"
          }`}
        >
          <span className="font-serif text-5xl">{syn.percent}</span>
          <span className="text-sm">% afinidad</span>
        </div>
        {syn.hiloRojo ? (
          <p className="mt-4 text-thread">
            Trigger kÃ¡rmico: mÃ¡s de 90% y aspectos al Nodo Norte. El Hilo Rojo estÃ¡ activo.
          </p>
        ) : syn.hasNodalAspect ? (
          <p className="mt-4 text-muted">Hay contacto nodal, pero el umbral del hilo aÃºn no se cruza.</p>
        ) : (
          <p className="mt-4 text-muted">
            Compatibilidad por aspectos entre ambas cartas. El hilo pide &gt;90% y nodos.
          </p>
        )}

        <h2 className="font-serif mt-10 text-2xl">Aspectos exactos</h2>
        <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
          {syn.aspects.map((a, i) => (
            <li key={`${a.a}-${a.b}-${i}`} className="px-4 py-3 text-sm">
              <span className="text-ink">
                {PLANET_META[a.a].name} {ASPECT_META[a.type].name} {PLANET_META[a.b].name}
              </span>
              <span className="ml-2 text-muted">orbe {a.orb}Â°</span>
            </li>
          ))}
          {syn.aspects.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">Pocos aspectos mayores. El cielo estÃ¡ quieto.</li>
          )}
        </ul>

        {matchError && (
          <p role="alert" className="mt-6 text-sm text-rose-300">
            {matchError}
          </p>
        )}
        {isMatch ? (
          <Link
            href={`/mensajes/${other.id}`}
            className="glow-thread mt-8 block rounded-full bg-thread py-3 text-center text-sm font-medium text-white"
          >
            Abrir conversación
          </Link>
        ) : (
          <p className="mt-8 text-center text-sm text-muted">
            Para chatear, ambos deben indicar que les gusta el perfil.
          </p>
        )}
        <Link
          href="/destinos"
          className="mt-3 block rounded-full border border-white/15 py-3 text-center text-sm"
        >
          Seguir deslizando
        </Link>
      </main>
    </div>
  );
}
