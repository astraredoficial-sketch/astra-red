"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isMissingAuthSessionError } from "@/lib/supabase/session";

interface AppNotification {
  id: string;
  event_type: "message" | "match" | "astral" | "compatibility";
  title: string;
  body: string;
  href: string;
  created_at: string;
  read_at: string | null;
}

function safeHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//") ? href : "/notificaciones";
}

export function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollingTimer: number | null = null;

    async function refresh() {
      if (!userId) return;

      const [listResult, countResult] = await Promise.all([
        supabase
          .from("app_notifications")
          .select("id, event_type, title, body, href, created_at, read_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("app_notifications")
          .select("id", { count: "exact", head: true })
          .is("read_at", null),
      ]);

      if (!active) return;
      if (listResult.error || countResult.error) {
        const issue = listResult.error ?? countResult.error;
        console.error("No se pudieron cargar las notificaciones:", issue);
        setError("No se pudieron actualizar tus notificaciones.");
        setLoading(false);
        return;
      }

      setNotifications((listResult.data ?? []) as AppNotification[]);
      setUnreadCount(countResult.count ?? 0);
      setError("");
      setLoading(false);
    }

    async function watchUser(nextUserId: string | null) {
      if (userId === nextUserId && (channel || !userId)) return;
      userId = nextUserId;
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
      if (pollingTimer !== null) {
        window.clearInterval(pollingTimer);
        pollingTimer = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      setLoading(Boolean(userId));
      if (!userId) return;

      channel = supabase
        .channel(`app-notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "app_notifications",
            filter: `recipient_id=eq.${userId}`,
          },
          () => void refresh(),
        )
        .subscribe((status, channelError) => {
          if (!active || userId !== nextUserId) return;
          if (status === "SUBSCRIBED") {
            if (pollingTimer !== null) {
              window.clearInterval(pollingTimer);
              pollingTimer = null;
            }
            void refresh();
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            console.error("No se pudo mantener la sincronización de avisos:", channelError);
            if (pollingTimer === null) {
              pollingTimer = window.setInterval(() => void refresh(), 15000);
            }
            void refresh();
          }
        });
      void refresh();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (!active) return;
        if (!session?.user) {
          router.replace("/acceso?mode=login");
          return;
        }
        void watchUser(session.user.id);
      }, 0);
    });

    void supabase.auth.getSession().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError) {
        if (isMissingAuthSessionError(authError)) {
          router.replace("/acceso?mode=login");
          return;
        }
        console.error("No se pudo comprobar la sesión para las notificaciones:", authError);
        setError("No se pudieron cargar tus notificaciones.");
        setLoading(false);
        return;
      }
      if (!data.session?.user) {
        router.replace("/acceso?mode=login");
        return;
      }
      void watchUser(data.session.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
      if (pollingTimer !== null) window.clearInterval(pollingTimer);
    };
  }, [router]);

  async function markAllAsRead() {
    setBusy(true);
    setError("");
    const { error: updateError } = await supabase
      .from("app_notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    setBusy(false);

    if (updateError) {
      console.error("No se pudieron marcar los avisos como leídos:", updateError);
      setError("No se pudieron marcar las notificaciones como leídas.");
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  }

  async function markAsRead(notification: AppNotification) {
    if (notification.read_at) return;
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("app_notifications")
      .update({ read_at: readAt })
      .eq("id", notification.id)
      .is("read_at", null);

    if (updateError) {
      console.error("No se pudo marcar la notificación como leída:", updateError);
      setError("No se pudo actualizar el estado de esta notificación.");
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, read_at: readAt } : item,
      ),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-astral">
            Tu universo privado
          </p>
          <h1 className="mt-2 font-serif text-3xl">Notificaciones</h1>
          <p className="mt-2 text-sm text-slate-400">
            Mensajes, nuevas afinidades y fechas astrales importantes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void markAllAsRead()}
          disabled={busy || unreadCount === 0}
          className="min-h-11 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Marcar todo como leído
        </button>
      </header>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-slate-400">Cargando notificaciones...</p>
      ) : notifications.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <p className="font-serif text-xl text-white">Tu cielo está en calma</p>
          <p className="mt-2 text-sm text-slate-400">
            Aquí aparecerán tus mensajes, conexiones mutuas y recordatorios astrales.
          </p>
        </section>
      ) : (
        <ul className="mt-6 space-y-3">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Link
                href={safeHref(notification.href)}
                onClick={() => void markAsRead(notification)}
                className={
                  "block min-h-11 rounded-2xl border p-5 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white " +
                  (notification.read_at
                    ? "border-slate-800 bg-slate-900/50 hover:bg-slate-900"
                    : "border-rose-400/30 bg-rose-950/25 hover:bg-rose-950/40")
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{notification.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {notification.body}
                    </p>
                    <time
                      dateTime={notification.created_at}
                      className="mt-3 block text-xs text-slate-500"
                    >
                      {new Intl.DateTimeFormat("es", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(notification.created_at))}
                    </time>
                  </div>
                  {!notification.read_at && (
                    <span
                      aria-label="No leída"
                      className="mt-1 size-2.5 shrink-0 rounded-full bg-rose-400"
                    />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
