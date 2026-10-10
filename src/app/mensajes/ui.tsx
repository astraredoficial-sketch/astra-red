"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AppNav } from "@/components/AppNav";
import { useSession } from "@/hooks/useSession";
import { findProfile } from "@/lib/lookup";
import { getConversations } from "@/lib/chat";

export function MensajesUi() {
  const { ready, me } = useSession();

  useEffect(() => {
    if (ready && !me) {
      // // // window.location.replace("/onboarding");
    }
  }, [ready, me]);

  if (!ready || !me) {
    return (
      <div className="grid flex-1 place-items-center text-muted">
        Abriendo tus conversaciones...
      </div>
    );
  }

  const conversations = getConversations(me.id)
    .map((conversation) => ({
      ...conversation,
      profile: findProfile(conversation.otherId),
    }))
    .filter(
      (conversation) =>
        conversation.profile &&
        conversation.profile.id !== me.id
    );

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-astral">
          Tu universo privado
        </p>

        <h1 className="mt-2 font-serif text-4xl">Mensajes</h1>

        <p className="mt-3 text-sm leading-6 text-muted">
          Las conexiones empiezan con una conversación.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-muted">
          Prototipo local: los mensajes se guardan en este navegador.
          Todavía no se envían a otros usuarios.
        </div>

        {conversations.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-thread/30 bg-thread/10 text-3xl text-thread">
              ?
            </div>

            <h2 className="mt-5 font-serif text-2xl">
              Tu próxima conversación empieza aquí
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
              Explora los destinos y abre el perfil de una persona
              para iniciar una conversación de prueba.
            </p>

            <Link
              href="/destinos"
              className="glow-thread mt-6 inline-flex rounded-full bg-thread px-6 py-3 text-sm font-medium text-white"
            >
              Explorar destinos
            </Link>
          </section>
        ) : (
          <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            {conversations.map((conversation) => {
              const profile = conversation.profile;

              if (!profile) return null;

              return (
                <Link
                  key={conversation.otherId}
                  href={`/mensajes/${conversation.otherId}`}
                  className="flex items-center gap-4 border-b border-white/[0.07] p-4 transition hover:bg-white/[0.06] last:border-b-0"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-astral/40 bg-gradient-to-br from-astral/40 to-thread/20 font-serif text-xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="truncate font-medium">
                        {profile.name}
                      </h2>

                      <time className="shrink-0 text-xs text-muted">
                        {new Date(
                          conversation.updatedAt
                        ).toLocaleDateString("es", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </time>
                    </div>

                    <p className="mt-1 truncate text-sm text-muted">
                      {conversation.lastMessage}
                    </p>
                  </div>

                  <span aria-hidden="true" className="text-thread">
                    ›
                  </span>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}


