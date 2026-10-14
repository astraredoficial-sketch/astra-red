"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabase/client";

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

type MatchRow = {
  user_a: string;
  user_b: string;
  created_at: string;
};

type Conversation = {
  otherId: string;
  name: string;
  lastMessage: string;
  updatedAt: string;
};

export function MensajesUi() {
  const router = useRouter();
  const { ready, store, me, error: sessionError } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || sessionError || me) return;
    router.replace(store?.currentUserId ? "/onboarding" : "/acceso?mode=login");
  }, [me, ready, router, sessionError, store?.currentUserId]);

  useEffect(() => {
    if (!me || !store) return;
    let active = true;
    let loadingConversations = false;
    const currentUser = me;
    const currentProfiles = store.profiles;

    async function loadConversations() {
      if (loadingConversations) return;
      loadingConversations = true;
      try {
        const { data: matches, error: matchError } = await supabase
          .from("matches")
          .select("user_a, user_b, created_at");

        if (!active) return;
        if (matchError) {
          setError(`No se pudieron cargar tus conexiones: ${matchError.message}`);
          setLoading(false);
          return;
        }

        const { data, error: messageError } = await supabase
          .from("chat_messages")
          .select("id, sender_id, recipient_id, body, created_at")
          .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
          .order("created_at", { ascending: false });

        if (!active) return;
        if (messageError) {
          setError(`No se pudieron cargar tus conversaciones: ${messageError.message}`);
          setLoading(false);
          return;
        }

        const profiles = new Map(
          currentProfiles.map((profile) => [profile.id, profile]),
        );
        const latest = new Map<string, Conversation>();
        const messagesByOther = new Map<string, MessageRow>();

        for (const row of data as MessageRow[]) {
          const otherId =
            row.sender_id === currentUser.id ? row.recipient_id : row.sender_id;
          if (!messagesByOther.has(otherId)) messagesByOther.set(otherId, row);
        }

        for (const match of matches as MatchRow[]) {
          const otherId =
            match.user_a === currentUser.id ? match.user_b : match.user_a;
          const profile = profiles.get(otherId);
          if (!profile) continue;

          const lastMessage = messagesByOther.get(otherId);
          latest.set(otherId, {
            otherId,
            name: profile.name,
            lastMessage:
              lastMessage?.body ??
              "Tienen una conexión mutua. Empieza la conversación.",
            updatedAt: lastMessage?.created_at ?? match.created_at,
          });
        }

        setConversations(
          [...latest.values()].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
        );
        setError("");
        setLoading(false);
      } finally {
        loadingConversations = false;
      }
    }

    void loadConversations();
    const pollingTimer = window.setInterval(() => {
      void loadConversations();
    }, 15000);
    return () => {
      active = false;
      window.clearInterval(pollingTimer);
    };
  }, [me, store]);

  return (
    <div className="flex flex-1 flex-col">
      <AppNav active="mensajes" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <p className="text-xs uppercase tracking-[0.3em] text-astral">
          Tu universo privado
        </p>
        <h1 className="mt-2 font-serif text-4xl">Mensajes</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Conversaciones con conexiones mutuas.
        </p>

        {sessionError && (
          <p role="alert" className="mt-5 text-sm text-thread">
            {sessionError}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 text-sm text-thread">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-sm text-muted">Cargando conversaciones...</p>
        ) : conversations.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-thread/30 bg-thread/10 text-3xl text-thread">
              <svg
                aria-hidden="true"
                className="size-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.2-.7L4 20l1.7-4.2A7.3 7.3 0 0 1 5 12a7.5 7.5 0 1 1 15-.5Z"
                />
                <path
                  strokeLinecap="round"
                  d="M9 11.5h.01M12.5 11.5h.01M16 11.5h.01"
                />
              </svg>
            </div>
            <h2 className="mt-5 font-serif text-2xl">
              Tus conversaciones aparecerán aquí
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
              Explora Destinos. Cuando tú y otra persona se den me gusta,
              podrán chatear en tiempo real.
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
            {conversations.map((conversation) => (
              <Link
                key={conversation.otherId}
                href={`/mensajes/${conversation.otherId}`}
                className="flex items-center gap-4 border-b border-white/[0.07] p-4 transition last:border-b-0 hover:bg-white/[0.06]"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-astral/40 bg-gradient-to-br from-astral/40 to-thread/20 font-serif text-xl">
                  {conversation.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="truncate font-medium">{conversation.name}</h2>
                    <time className="shrink-0 text-xs text-muted">
                      {new Date(conversation.updatedAt).toLocaleDateString(
                        "es",
                        { day: "2-digit", month: "short" },
                      )}
                    </time>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">
                    {conversation.lastMessage}
                  </p>
                </div>
                <span aria-hidden="true" className="text-thread">›</span>
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
