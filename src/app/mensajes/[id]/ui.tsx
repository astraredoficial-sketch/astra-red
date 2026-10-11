"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { AppNav } from "@/components/AppNav";
import { useSession } from "@/hooks/useSession";
import { findProfile } from "@/lib/lookup";
import {
  getChatMessages,
  sendChatMessage,
} from "@/lib/chat";

export function ConversacionUi() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, me } = useSession();

  const otherId = params.id;

  const other = useMemo(
    () => (ready ? findProfile(otherId) : undefined),
    [ready, otherId]
  );

  const [draft, setDraft] = useState("");
  const [, setRevision] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !me) {
      // router.replace("/onboarding");
    }
  }, [ready, me, router]);

  const messages =
    ready && me && other
      ? getChatMessages(me.id, other.id)
      : [];

  if (!ready || !me) {
    return (
      <div className="grid flex-1 place-items-center text-muted">
        Abriendo conversación...
      </div>
    );
  }

  if (!other || other.id === me.id) {
    return (
      <div className="grid flex-1 place-items-center px-6 text-center">
        <div>
          <p className="text-muted">
            No encontramos esta conversación.
          </p>
          <Link href="/mensajes" className="mt-4 inline-block text-thread">
            Volver a mensajes
          </Link>
        </div>
      </div>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!me || !other) return;

    setError("");

    try {
      sendChatMessage(me.id, other.id, draft);
      setDraft("");
      setRevision((value) => value + 1);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar el mensaje."
      );
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-3 py-4 sm:px-4 sm:py-6">
        <header className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Link
            href="/mensajes"
            aria-label="Volver a mensajes"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 hover:bg-white/5"
          >
            ?
          </Link>

          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-astral/40 bg-gradient-to-br from-astral/40 to-thread/20 font-serif text-xl">
            {other.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-2xl">
              {other.name}
            </h1>
            <Link
              href={`/conectar/${other.id}`}
              className="text-xs text-astral hover:text-thread"
            >
              Ver sinastría
            </Link>
          </div>
        </header>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-muted">
          Chat de prueba: solo tú puedes ver los mensajes guardados
          en este navegador. La otra persona no los recibe.
        </div>

        <section
          aria-label="Mensajes de la conversación"
          aria-live="polite"
          className="my-4 flex min-h-[280px] flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/[0.06] bg-black/10 p-3 sm:p-5"
        >
          {messages.length === 0 ? (
            <div className="m-auto max-w-xs py-10 text-center">
              <div className="text-3xl text-thread">?</div>
              <h2 className="mt-3 font-serif text-xl">
                Abre el hilo
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Escribe el primer mensaje y empieza la conversación.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const mine = message.senderId === me.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <article
                    className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                      mine
                        ? "rounded-br-sm bg-thread text-white"
                        : "rounded-bl-sm border border-white/10 bg-[#171323]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">
                      {message.text}
                    </p>

                    <time
                      className={`mt-1 block text-right text-[10px] ${
                        mine ? "text-white/70" : "text-muted"
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString(
                        "es",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </time>
                  </article>
                </div>
              );
            })
          )}
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-[#12101a] p-2"
        >
          <label htmlFor="chat-message" className="sr-only">
            Escribe un mensaje
          </label>

          <div className="flex items-end gap-2">
            <textarea
              id="chat-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe algo bonito..."
              rows={1}
              maxLength={2000}
              className="max-h-32 min-h-11 flex-1 resize-y bg-transparent px-3 py-3 text-sm text-ink outline-none placeholder:text-muted"
            />

            <button
              type="submit"
              disabled={!draft.trim()}
              className="glow-thread grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-thread text-lg text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              aria-label="Enviar mensaje"
            >
              ?
            </button>
          </div>

          <div className="flex items-center justify-between px-3 pb-1 text-[10px] text-muted">
            <span>Enter para enviar con el botón</span>
            <span>{draft.length}/2000</span>
          </div>

          {error && (
            <p role="alert" className="px-3 pb-2 text-sm text-thread">
              {error}
            </p>
          )}
        </form>
      </main>
    </div>
  );
}






