"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { useSession } from "@/hooks/useSession";
import { SynastryTool } from "./SynastryTool";

export function SinastriaUi() {
  const router = useRouter();
  const { ready, me, store, error: sessionError } = useSession();

  useEffect(() => {
    if (!ready || sessionError || me) return;

    router.replace(
      store?.currentUserId ? "/onboarding" : "/acceso?mode=login",
    );
  }, [me, ready, router, sessionError, store?.currentUserId]);

  if (!ready || (!me && !sessionError)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">
        Verificando tu cuenta...
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-center text-rose-200">
        <p role="alert">{sessionError}</p>
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNav active="sinastria" />
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <header className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-300">
            AstraRed | Compatibilidad astrologica
          </p>
          <h1 className="font-serif text-3xl text-white sm:text-4xl">
            Sinastria
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            Compara tu carta natal con la de otra persona mediante sus datos
            de nacimiento y consulta los aspectos entre ambas cartas.
          </p>
        </header>

        <SynastryTool me={me} />
      </main>
    </div>
  );
}