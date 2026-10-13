"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppNav } from "@/components/AppNav";
import { useSession } from "@/hooks/useSession";
import { getIcebreakers } from "@/lib/chat/icebreakers";
import { supabase } from "@/lib/supabase/client";

type ReportReason = "obscene" | "harassment" | "spam" | "other";

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "obscene", label: "Contenido obsceno o no deseado" },
  { value: "harassment", label: "Acoso o amenazas" },
  { value: "spam", label: "Spam o estafa" },
  { value: "other", label: "Otro motivo" },
];

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

type MessageFields = Pick<
  MessageRow,
  "id" | "sender_id" | "recipient_id" | "body" | "created_at"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function edgeFunctionErrorMessage(error: Error): Promise<string> {
  if ("context" in error && error.context instanceof Response) {
    try {
      const body: unknown = await error.context.clone().json();
      if (isRecord(body) && typeof body.error === "string") return body.error;
    } catch {
      return error.message;
    }
  }
  return error.message;
}

function toMessage(row: MessageFields): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.body,
    createdAt: row.created_at,
  };
}

export function ConversacionUi() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, store, me, error: sessionError } = useSession();
  const otherId = params.id;
  const other = useMemo(
    () => store?.profiles.find((profile) => profile.id === otherId),
    [otherId, store],
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isMatch, setIsMatch] = useState(false);
  const [conversationBlocked, setConversationBlocked] = useState(false);
  const [error, setError] = useState("");
  const [safetyNotice, setSafetyNotice] = useState("");
  const [safetyError, setSafetyError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("obscene");
  const [syncNotice, setSyncNotice] = useState("");
  const [syncError, setSyncError] = useState("");
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [icebreakerRound, setIcebreakerRound] = useState(0);

  useEffect(() => {
    if (!ready || sessionError || me) return;
    router.replace(store?.currentUserId ? "/onboarding" : "/acceso?mode=login");
  }, [me, ready, router, sessionError, store?.currentUserId]);

  useEffect(() => {
    if (!me || !other || other.id === me.id) {
      return;
    }

    let active = true;
    const currentUser = me;
    const currentOther = other;
    const [userA, userB] = [currentUser.id, currentOther.id].sort();
    const messageFilter =
      `and(sender_id.eq.${currentUser.id},recipient_id.eq.${currentOther.id}),` +
      `and(sender_id.eq.${currentOther.id},recipient_id.eq.${currentUser.id})`;

    async function loadConversation() {
      setLoading(true);
      setError("");

      const { data: match, error: matchError } = await supabase
        .from("matches")
        .select("user_a")
        .eq("user_a", userA)
        .eq("user_b", userB)
        .maybeSingle();

      if (!active) return;
      if (matchError) {
        setError(`No se pudo comprobar la conexión: ${matchError.message}`);
        setLoading(false);
        return;
      }
      if (!match) {
        setIsMatch(false);
        setLoading(false);
        return;
      }

      setIsMatch(true);
      let refreshing = false;
      let pollingTimer: number | null = null;

      async function refreshMessages() {
        if (!active || refreshing) return;
        refreshing = true;
        try {
          const { data, error: messagesError } = await supabase
            .from("chat_messages")
            .select("id, sender_id, recipient_id, body, created_at, read_at")
            .or(messageFilter)
            .order("created_at", { ascending: true });

          if (!active) return;
          if (messagesError) {
            setSyncError(`No se pudieron sincronizar los mensajes: ${messagesError.message}`);
            return;
          }

          const rows = data as MessageRow[];
          setMessages(rows.map(toMessage));
          setSyncError("");

          const unreadIds = rows
            .filter(
              (row) =>
                row.recipient_id === currentUser.id && row.read_at === null,
            )
            .map((row) => row.id);
          if (unreadIds.length > 0) {
            const { error: readError } = await supabase
              .from("chat_messages")
              .update({ read_at: new Date().toISOString() })
              .in("id", unreadIds)
              .eq("recipient_id", currentUser.id)
              .is("read_at", null);
            if (readError && active) {
              setSyncError(`No se pudieron marcar los mensajes como leídos: ${readError.message}`);
            }
          }
        } finally {
          refreshing = false;
        }
      }

      await refreshMessages();
      if (!active) return;
      setLoading(false);

      function startPolling() {
        setSyncNotice(
          "Conexión en tiempo real no disponible. Los mensajes se actualizan automáticamente.",
        );
        if (pollingTimer === null) {
          pollingTimer = window.setInterval(() => {
            void refreshMessages();
          }, 5000);
        }
      }

      function stopPolling() {
        if (pollingTimer !== null) {
          window.clearInterval(pollingTimer);
          pollingTimer = null;
        }
        setSyncNotice("");
      }

      const channel = supabase
        .channel(`conversation:${userA}:${userB}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          (payload) => {
            const row = payload.new as MessageRow;
            const belongsToConversation =
              (row.sender_id === currentUser.id &&
                row.recipient_id === currentOther.id) ||
              (row.sender_id === currentOther.id &&
                row.recipient_id === currentUser.id);
            if (!belongsToConversation) return;

            const incoming = toMessage(row);
            setMessages((current) =>
              current.some((message) => message.id === incoming.id)
                ? current
                : [...current, incoming],
            );

            if (
              row.recipient_id === currentUser.id &&
              row.read_at === null
            ) {
              void supabase
                .from("chat_messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", row.id)
                .eq("recipient_id", currentUser.id)
                .is("read_at", null)
                .then(({ error: readError }) => {
                  if (readError && active) {
                    setError(
                      `No se pudo marcar el mensaje como leído: ${readError.message}`,
                    );
                  }
                });
            }
          },
        )
        .subscribe((status, channelError) => {
          if (!active) return;
          if (status === "SUBSCRIBED") {
            stopPolling();
            void refreshMessages();
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            if (channelError) {
              console.error("Realtime no está disponible para esta conversación:", channelError);
            }
            startPolling();
          }
        });

      return () => {
        if (pollingTimer !== null) window.clearInterval(pollingTimer);
        void supabase.removeChannel(channel);
      };
    }

    let unsubscribe: (() => void) | undefined;
    void loadConversation().then((cleanup) => {
      if (!active) {
        cleanup?.();
      } else {
        unsubscribe = cleanup;
      }
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [me, other]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!me || !other || !isMatch || busy) return;
    const currentOther = other;

    const body = draft.trim();
    if (!body) return;

    setBusy(true);
    setError("");
    try {
      const { data, error: sendError } = await supabase.functions.invoke(
        "chat-assistant",
        {
          body: {
            action: "send-message",
            recipientId: currentOther.id,
            text: body,
          },
        },
      );
      if (sendError) {
        throw new Error(
          `No se pudo revisar o enviar el mensaje: ${await edgeFunctionErrorMessage(sendError)}`,
        );
      }
      const response: unknown = data;
      if (!isRecord(response) || !isRecord(response.message)) {
        throw new Error("El servidor no confirmó el envío del mensaje.");
      }
      const row = response.message;
      if (
        typeof row.id !== "string" ||
        typeof row.sender_id !== "string" ||
        typeof row.recipient_id !== "string" ||
        typeof row.body !== "string" ||
        typeof row.created_at !== "string"
      ) {
        throw new Error("El servidor devolvió un mensaje con formato inválido.");
      }
      const sent = toMessage({
        id: row.id,
        sender_id: row.sender_id,
        recipient_id: row.recipient_id,
        body: row.body,
        created_at: row.created_at,
      });
      setMessages((current) =>
        current.some((message) => message.id === sent.id)
          ? current
          : [...current, sent],
      );
      setDraft("");
      const { error: notificationError } = await supabase.functions.invoke(
        "notify-new-message",
        { body: { event: "message", messageId: sent.id } },
      );
      if (notificationError) {
        setError(
          `El mensaje se envió, pero no se pudo enviar el aviso por correo: ${notificationError.message}`,
        );
      }
    } catch (cause) {
      setError(
        `No se pudo enviar el mensaje: ${
          cause instanceof Error ? cause.message : "Error desconocido."
        }`,
      );
    } finally {
      setBusy(false);
    }
  }

  function loadIcebreakers() {
    setIcebreakers(getIcebreakers(icebreakerRound));
    setIcebreakerRound((round) => round + 1);
  }

  async function handleBlock() {
    if (!other || !me || busy || conversationBlocked) return;
    if (!window.confirm(`¿Quieres bloquear a ${other.name}?`)) return;

    setBusy(true);
    setSafetyError("");
    setSafetyNotice("");
    try {
      const { error: blockError } = await supabase.functions.invoke(
        "chat-assistant",
        { body: { action: "block-user", recipientId: other.id } },
      );
      if (blockError) {
        throw new Error(await edgeFunctionErrorMessage(blockError));
      }

      setConversationBlocked(true);
      setIsMatch(false);
      setIcebreakers([]);
      setSafetyNotice(`Bloqueaste a ${other.name}. No podrá escribirte.`);
    } catch (cause) {
      setSafetyError(
        cause instanceof Error
          ? `No se pudo bloquear esta cuenta: ${cause.message}`
          : "No se pudo bloquear esta cuenta. Inténtalo de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!other || !me || busy) return;

    setBusy(true);
    setSafetyError("");
    setSafetyNotice("");
    try {
      const { error: reportError } = await supabase.functions.invoke(
        "chat-assistant",
        {
          body: {
            action: "report-user",
            recipientId: other.id,
            reason: reportReason,
          },
        },
      );
      if (reportError) {
        throw new Error(await edgeFunctionErrorMessage(reportError));
      }

      setReportOpen(false);
      setSafetyNotice("Gracias. Recibimos tu reporte para revisarlo.");
    } catch (cause) {
      setSafetyError(
        cause instanceof Error
          ? `No se pudo enviar el reporte: ${cause.message}`
          : "No se pudo enviar el reporte. Inténtalo de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!ready || (!me && !sessionError)) {
    return (
      <div className="grid flex-1 place-items-center text-muted">
        Abriendo conversación...
      </div>
    );
  }

  if (sessionError) {
    return (
      <div role="alert" className="grid flex-1 place-items-center px-6 text-center text-thread">
        {sessionError}
      </div>
    );
  }

  if (!other || other.id === me?.id) {
    return (
      <div className="grid flex-1 place-items-center px-6 text-center">
        <div>
          <p className="text-muted">No encontramos este perfil.</p>
          <Link href="/destinos" className="mt-4 inline-block text-thread">
            Volver a Destinos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppNav active="mensajes" />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-3 py-4 sm:px-4 sm:py-6">
        <header className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Link
            href="/mensajes"
            aria-label="Volver a mensajes"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 hover:bg-white/5"
          >
            ←
          </Link>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-astral/40 bg-gradient-to-br from-astral/40 to-thread/20 font-serif text-xl">
            {other.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-serif text-2xl">{other.name}</h1>
            <Link
              href={`/conectar/${other.id}`}
              className="text-xs text-astral hover:text-thread"
            >
              Ver sinastría
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              setSafetyError("");
              setReportOpen((open) => !open);
            }}
            disabled={busy || !isMatch || conversationBlocked}
            className="rounded-full border border-white/15 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/5 disabled:opacity-50"
          >
            Reportar
          </button>
          <button
            type="button"
            onClick={() => void handleBlock()}
            disabled={busy || conversationBlocked}
            className="rounded-full border border-thread/30 px-3 py-2 text-xs text-thread transition hover:bg-thread/10 disabled:opacity-50"
          >
            Bloquear
          </button>
        </header>

        {reportOpen && (
          <form
            onSubmit={handleReport}
            className="mt-3 rounded-xl border border-white/10 bg-[#12101a] p-3"
          >
            <label
              htmlFor="chat-report-reason"
              className="mb-2 block text-sm text-slate-200"
            >
              ¿Por qué quieres reportar esta cuenta?
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                id="chat-report-reason"
                value={reportReason}
                onChange={(event) =>
                  setReportReason(event.target.value as ReportReason)
                }
                className="min-h-10 flex-1 rounded-lg border border-white/10 bg-[#171323] px-3 text-sm text-slate-100"
              >
                {REPORT_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busy}
                className="min-h-10 rounded-lg bg-thread px-4 text-sm text-white disabled:opacity-50"
              >
                {busy ? "Enviando..." : "Enviar reporte"}
              </button>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                disabled={busy}
                className="min-h-10 rounded-lg border border-white/10 px-3 text-sm text-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
        {(safetyNotice || safetyError) && (
          <p
            role={safetyError ? "alert" : "status"}
            className={`mt-3 text-sm ${safetyError ? "text-thread" : "text-emerald-300"}`}
          >
            {safetyError || safetyNotice}
          </p>
        )}

        {loading ? (
          <p className="my-8 text-center text-sm text-muted">
            Cargando conversación...
          </p>
        ) : !isMatch ? (
          <section className="my-auto py-12 text-center">
            <h2 className="font-serif text-xl">Esta conversación aún no está abierta</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
              {conversationBlocked
                ? "Bloqueaste esta cuenta. Ya no podrán enviarse mensajes."
                : "Solo pueden escribirse quienes se hayan dado me gusta mutuamente."}
            </p>
            <Link
              href="/destinos"
              className="mt-5 inline-block text-sm text-thread underline underline-offset-4"
            >
              Volver a Destinos
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => void loadIcebreakers()}
                className="rounded-full border border-astral/30 bg-astral/10 px-4 py-2 text-sm text-[#e5ccff] transition hover:bg-astral/20"
              >
                Ayúdame a romper el hielo
              </button>
              {icebreakers.length > 0 && (
                <ul className="mt-3 grid gap-2">
                  {icebreakers.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => setDraft(suggestion)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/[0.08]"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted">
                Ideas gratis. Elige una para editarla antes de enviarla.
              </p>
            </div>
            {(syncNotice || syncError) && (
              <p
                role={syncError ? "alert" : "status"}
                className={`mt-3 text-sm ${syncError ? "text-thread" : "text-muted"}`}
              >
                {syncError || syncNotice}
              </p>
            )}
            <section
              aria-label="Mensajes de la conversación"
              aria-live="polite"
              className="my-4 flex min-h-[280px] flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/[0.06] bg-black/10 p-3 sm:p-5"
            >
              {messages.length === 0 ? (
                <div className="m-auto max-w-xs py-10 text-center">
                  <h2 className="font-serif text-xl">Abre el hilo</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Escribe el primer mensaje y empieza la conversación.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const mine = message.senderId === me?.id;
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
                        <time className="mt-1 block text-right text-[10px] text-white/70">
                          {new Date(message.createdAt).toLocaleTimeString(
                            "es",
                            { hour: "2-digit", minute: "2-digit" },
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
              <p className="px-3 pb-2 text-xs leading-5 text-muted">
                Un filtro automático básico bloquea algunas palabras obscenas u
                ofensivas. No detecta todo; puedes reportar o bloquear una cuenta.
              </p>
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
                  disabled={!draft.trim() || busy}
                  className="glow-thread grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-thread text-lg text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  aria-label="Enviar mensaje"
                >
                  {busy ? "…" : "➤"}
                </button>
              </div>
              {error && (
                <p role="alert" className="px-3 pb-2 text-sm text-thread">
                  {error}
                </p>
              )}
            </form>
          </>
        )}
        {error && !isMatch && (
          <p role="alert" className="mt-3 text-center text-sm text-thread">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
