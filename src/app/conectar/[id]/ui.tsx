"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppNav } from "@/components/AppNav";
import { HiloRojo } from "@/components/HiloRojo";
import { useSession } from "@/hooks/useSession";
import { ASPECT_META, PLANET_META } from "@/lib/astro/constants";
import { computeSynastry } from "@/lib/astro/synastry";
import { findProfile } from "@/lib/lookup";

export function ConectarUi() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, me } = useSession();

  const other = useMemo(
    () => (ready ? findProfile(params.id) : undefined),
    [ready, params.id],
  );
  const syn = me && other ? computeSynastry(me.chart, other.chart) : null;

  useEffect(() => {
    if (ready && !me) router.replace("/onboarding");
  }, [ready, me, router]);

  if (!ready || !me) {
    return <div className="grid flex-1 place-items-center text-muted">Tejiendo aspectosâ€¦</div>;
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

        <Link
          href={`/mensajes/${other.id}`}
          className="glow-thread mt-8 block rounded-full bg-thread py-3 text-center text-sm font-medium text-white"
        >
          Enviar mensaje
        </Link>
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


