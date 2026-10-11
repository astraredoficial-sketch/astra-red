"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabase/client";

export function CuentaUi() {
  const router = useRouter();
  const { ready, store, me, error: sessionError } = useSession();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || sessionError || me) return;
    router.replace(store?.currentUserId ? "/onboarding" : "/acceso?mode=login");
  }, [me, ready, router, sessionError, store?.currentUserId]);

  useEffect(() => {
    let active = true;

    async function loadEmail() {
      const { data, error: userError } = await supabase.auth.getUser();
      if (!active) return;
      if (userError) {
        setError(`No se pudo cargar tu cuenta: ${userError.message}`);
        return;
      }
      setEmail(data.user?.email ?? "");
    }

    void loadEmail();
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    setBusy(true);
    setError("");

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(`No se pudo cerrar la sesión: ${signOutError.message}`);
      setBusy(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (!ready || (!me && !sessionError)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">
        Cargando tu cuenta...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <AppNav active="cuenta" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.25em] text-astral">
            Tu universo privado
          </p>
          <h1 className="mt-2 font-serif text-3xl">Mi cuenta</h1>
        </header>

        {sessionError && (
          <p role="alert" className="text-sm text-rose-300">
            {sessionError}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}

        {me && (
          <>
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-amber-300">
                    Plan gratuito
                  </span>
                  <h2 className="mt-4 font-serif text-2xl">{me.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{email}</p>
                  <p className="mt-3 text-sm text-slate-300">
                    {me.locationCity}, {me.locationCountry}
                  </p>
                </div>
                <span className="text-3xl" aria-hidden="true">✨</span>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-purple-900/30 to-slate-900 p-6 shadow-xl shadow-amber-950/20">
              <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-950">
                    Calendario en beta
                  </span>
                  <h2 className="mt-3 font-serif text-2xl">
                    Explora el ritmo de la Luna
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                    Prueba gratis las fases lunares, planifica fechas y guarda
                    tus intenciones. Sin cobros durante la beta.
                  </p>
                </div>
                <Link
                  href="/calendario"
                  className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-rose-400 px-6 py-3 text-center text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-950/30 transition hover:scale-[1.02] hover:brightness-110"
                >
                  ✨ Probar calendario
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="font-serif text-xl">Preferencias de conexión</h2>
              <p className="mt-3 text-sm text-slate-300">
                Identidad: {me.gender} · Desea conocer: {me.targetGender}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Tus datos de nacimiento se mantienen privados y se usan para
                calcular la carta y la compatibilidad.
              </p>
            </section>
          </>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/carta"
            className="flex-1 rounded-full border border-white/15 px-5 py-3 text-center text-sm hover:bg-white/5"
          >
            Ver mi carta natal
          </Link>
          <Link
            href="/onboarding"
            className="flex-1 rounded-full border border-white/15 px-5 py-3 text-center text-sm hover:bg-white/5"
          >
            Actualizar datos y carta
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSignOut()}
            className="flex-1 rounded-full bg-thread px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>
        </div>
      </main>
    </div>
  );
}
