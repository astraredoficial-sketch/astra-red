"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { VipConnectionAlert } from "@/components/VipConnectionAlert";
import { useSession } from "@/hooks/useSession";
import { computeSynastry } from "@/lib/astro/synastry";
import { filterProfilesForUser } from "@/lib/filters";
import { supabase } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";

export function DestinosUi() {
  const router = useRouter();
  const { ready, store, me, error: sessionError } = useSession();
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [vipAlertProfile, setVipAlertProfile] = useState<UserProfile | null>(
    null,
  );
  const [vipCheckError, setVipCheckError] = useState<{
    profileId: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!ready || sessionError) return;
    if (!me) {
      router.replace(
        store?.currentUserId ? "/onboarding" : "/acceso?mode=login",
      );
    }
  }, [me, ready, router, sessionError, store?.currentUserId]);

  useEffect(() => {
    if (!me) return;
    let active = true;
    const currentUser = me;

    async function loadLikes() {
      const { data, error: likesError } = await supabase
        .from("profile_likes")
        .select("liked_id")
        .eq("liker_id", currentUser.id);

      if (!active) return;
      if (likesError) {
        setError(`No se pudieron cargar tus destinos guardados: ${likesError.message}`);
        return;
      }
      setSeenIds(new Set(data.map((item) => item.liked_id)));
    }

    void loadLikes();
    return () => {
      active = false;
    };
  }, [me]);

  const availableProfiles = useMemo(() => {
    if (!me || !store) return [];
    return filterProfilesForUser(
      me,
      store.profiles.filter((profile) => !seenIds.has(profile.id)),
    )
      .map((profile) => ({
        profile,
        compatibility: computeSynastry(me.chart, profile.chart),
      }))
      .sort((a, b) => b.compatibility.percent - a.compatibility.percent);
  }, [me, seenIds, store]);

  const current = availableProfiles[0];
  const profilePlacements: [string, string][] = [];
  if (current) {
    profilePlacements.push(["Sol", current.profile.chart.triad.sun.sign]);
    if (!current.profile.chart.timeUnknown) {
      profilePlacements.push(["Luna", current.profile.chart.triad.moon.sign]);
      profilePlacements.push([
        "Ascendente",
        current.profile.chart.triad.asc.sign,
      ]);
    }
  }

  useEffect(() => {
    if (!me || !current || current.compatibility.percent !== 100) return;

    let active = true;
    const targetProfile = current.profile;

    async function checkVipMemberships() {
      const { data, error: vipError } = await supabase.rpc(
        "are_both_users_vip",
        { target_user_id: targetProfile.id },
      );

      if (!active) return;
      if (vipError) {
        console.error("No se pudo comprobar la membresía VIP:", vipError);
        setVipCheckError({
          profileId: targetProfile.id,
          message: `No se pudo comprobar la membresía VIP: ${vipError.message}`,
        });
        return;
      }
      setVipCheckError(null);
      if (data === true) setVipAlertProfile(targetProfile);
    }

    void checkVipMemberships();
    return () => {
      active = false;
    };
  }, [current, me]);

  async function handleSwipe(action: "like" | "pass") {
    if (!me || !current || busy) return;
    setBusy(true);
    setError("");
    setNotice("");

    if (action === "pass") {
      setSeenIds((previous) => new Set(previous).add(current.profile.id));
      setBusy(false);
      return;
    }

    const { data: matched, error: likeError } = await supabase.rpc(
      "like_profile",
      { target_user_id: current.profile.id },
    );
    setBusy(false);

    if (likeError) {
      setError(`No se pudo guardar tu me gusta: ${likeError.message}`);
      return;
    }

    setSeenIds((previous) => new Set(previous).add(current.profile.id));
    if (matched) {
      const { error: notificationError } = await supabase.functions.invoke(
        "notify-new-message",
        {
          body: { event: "match", otherUserId: current.profile.id },
        },
      );
      if (notificationError) {
        console.error("No se pudo enviar el aviso de conexión mutua:", notificationError);
      }
      router.push(`/mensajes/${current.profile.id}`);
    } else {
      setNotice("Me gusta guardado. Te avisaremos cuando haya una conexión mutua.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <AppNav active="destinos" />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center p-4">
        {!ready || (!me && !sessionError) ? (
          <p className="text-sm text-slate-400">Cargando tus destinos astrales...</p>
        ) : sessionError ? (
          <p role="alert" className="max-w-lg text-center text-sm text-rose-300">
            {sessionError}
          </p>
        ) : current ? (
          <article className="relative w-full space-y-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-purple-300">
                Destinos astrales
              </span>
              <span className="rounded-full border border-rose-500/30 bg-rose-950/60 px-3 py-1 text-xs font-bold text-rose-300">
                {current.compatibility.percent}% afinidad
              </span>
            </div>
            {current.compatibility.timeApproximate && (
              <p className="-mt-4 text-xs leading-5 text-amber-200/80">
                Afinidad aproximada: falta una hora de nacimiento; se omiten
                los aspectos de Luna y Ascendente.
              </p>
            )}

            <div className="mx-auto grid size-40 place-items-center overflow-hidden rounded-3xl border border-amber-300/30 bg-slate-950/70 text-5xl font-serif text-amber-200 shadow-lg shadow-black/20">
              {current.profile.avatarUrl ? (
                <Image
                  src={current.profile.avatarUrl}
                  alt={`Foto de perfil de ${current.profile.name}`}
                  width={160}
                  height={160}
                  unoptimized
                  className="size-40 object-cover"
                />
              ) : (
                current.profile.name.trim().charAt(0).toUpperCase() || "✦"
              )}
            </div>

            <div>
              <h1 className="font-serif text-3xl font-bold">
                {current.profile.name}
              </h1>
              <p className="mt-3 text-sm text-slate-300">
                {profilePlacements
                  .map(([label, sign]) => `${label} en ${sign}`)
                  .join(" · ")}
              </p>
            </div>

            <div
              className="grid grid-flow-col auto-cols-fr gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-center"
            >
              {profilePlacements.map(([label, sign]) => (
                <div key={label}>
                  <span className="block text-[10px] font-semibold uppercase text-slate-500">
                    {label}
                  </span>
                  <span className="text-xs font-bold text-rose-300">{sign}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSwipe("pass")}
                aria-label="Pasar perfil"
                className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xl font-bold text-slate-300 transition hover:text-rose-400 disabled:opacity-50"
              >
                ×
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSwipe("like")}
                aria-label="Me gusta este perfil"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-xl font-bold text-white transition hover:bg-rose-500 disabled:opacity-50"
              >
                ♥
              </button>
            </div>

            <Link
              href={`/conectar/${current.profile.id}`}
              className="block text-center text-sm text-purple-300 underline underline-offset-4"
            >
              Ver compatibilidad detallada
            </Link>
          </article>
        ) : (
          <section className="space-y-4 text-center">
            <span className="text-4xl" aria-hidden="true">🌌</span>
            <h1 className="font-serif text-2xl font-bold">
              No hay más perfiles compatibles por ahora
            </h1>
            <p className="mx-auto max-w-md text-sm leading-6 text-slate-400">
              Mostramos perfiles reales que coinciden con tus preferencias y
              tienen una carta natal completa. Vuelve cuando haya nuevas
              personas.
            </p>
            {notice && (
              <p role="status" className="text-sm text-emerald-300">
                {notice}
              </p>
            )}
          </section>
        )}

        {notice && current && (
          <p role="status" className="mt-4 text-center text-sm text-emerald-300">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 max-w-lg text-center text-sm text-rose-300">
            {error}
          </p>
        )}
        {vipCheckError && vipCheckError.profileId === current?.profile.id && (
          <p role="alert" className="mt-4 max-w-lg text-center text-sm text-rose-300">
            {vipCheckError.message}
          </p>
        )}
      </main>
      {me && vipAlertProfile && (
        <VipConnectionAlert
          me={me}
          other={vipAlertProfile}
          onClose={() => setVipAlertProfile(null)}
        />
      )}
    </div>
  );
}
