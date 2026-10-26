"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/lib/supabase/client";
import { isMissingAuthSessionError } from "@/lib/supabase/session";

interface Props {
  active?: "carta" | "destinos" | "calendario" | "ciclo-personal" | "mensajes" | "notificaciones" | "cuenta";
}

type NavIconName = "carta" | "destinos" | "calendario" | "ciclo-personal" | "mensajes" | "notificaciones" | "cuenta";

function NavIcon({ name }: { name: NavIconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
  };

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      {...common}
    >
      {name === "carta" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
        </>
      )}
      {name === "destinos" && (
        <>
          <path d="M12 20s-7.5-4.3-7.5-10a4.2 4.2 0 0 1 7.5-2.6A4.2 4.2 0 0 1 19.5 10c0 5.7-7.5 10-7.5 10Z" />
          <path d="M8.5 12h2l1-2 1.5 4 1-2h1.5" />
        </>
      )}
      {name === "calendario" && (
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" />
        </>
      )}
      {name === "mensajes" && (
        <>
          <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.2-.7L4 20l1.7-4.2A7.3 7.3 0 0 1 5 12a7.5 7.5 0 1 1 15-.5Z" />
          <path d="M9 11.5h.01M12.5 11.5h.01M16 11.5h.01" />
        </>
      )}
      {name === "notificaciones" && (
        <>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
        </>
      )}
      {name === "cuenta" && (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        </>
      )}
    </svg>
  );
}

export function AppNav({ active }: Props) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadError, setUnreadError] = useState("");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollingTimer: number | null = null;

    async function watchUnreadMessages(userId: string | null) {
      if (currentUserId === userId && (channel || !userId)) return;
      currentUserId = userId;
      if (pollingTimer !== null) {
        window.clearInterval(pollingTimer);
        pollingTimer = null;
      }
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
      setUnreadCount(0);
      setUnreadError("");
      if (!userId) return;
      let refreshVersion = 0;

      function startPolling() {
        if (pollingTimer === null) {
          pollingTimer = window.setInterval(() => {
            void refreshUnreadCount();
          }, 15000);
        }
      }

      function stopPolling() {
        if (pollingTimer !== null) {
          window.clearInterval(pollingTimer);
          pollingTimer = null;
        }
      }

      async function refreshUnreadCount() {
        const version = ++refreshVersion;
        const { count, error } = await supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", userId)
          .is("read_at", null);

        if (
          !active ||
          currentUserId !== userId ||
          version !== refreshVersion
        ) {
          return;
        }
        if (error) {
          console.error("No se pudieron consultar los mensajes sin leer:", error);
          setUnreadError("No se pudieron actualizar los mensajes sin leer.");
          return;
        }

        setUnreadError("");
        setUnreadCount(count ?? 0);
      }

      channel = supabase
        .channel(`unread-messages:${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "chat_messages" },
          () => void refreshUnreadCount(),
        )
        .subscribe((status, error) => {
          if (!active || currentUserId !== userId) return;
          if (status === "SUBSCRIBED") {
            stopPolling();
            void refreshUnreadCount();
            return;
          }
          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            console.error("No se pudo actualizar el contador de mensajes:", error);
            setUnreadError("No se pudieron actualizar los mensajes sin leer.");
            startPolling();
          }
        });
      void refreshUnreadCount();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (active) void watchUnreadMessages(session?.user.id ?? null);
      }, 0);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        if (isMissingAuthSessionError(error)) {
          void watchUnreadMessages(null);
          return;
        }
        console.error("No se pudo verificar la sesión para los mensajes:", error);
        setUnreadError("No se pudieron actualizar los mensajes sin leer.");
        return;
      }
      void watchUnreadMessages(data.session?.user.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      if (pollingTimer !== null) window.clearInterval(pollingTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollingTimer: number | null = null;

    async function watchNotifications(userId: string | null) {
      if (currentUserId === userId && (channel || !userId)) return;
      currentUserId = userId;
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
      if (pollingTimer !== null) {
        window.clearInterval(pollingTimer);
        pollingTimer = null;
      }
      setUnreadNotificationCount(0);
      setNotificationError("");
      if (!userId) return;

      async function refresh() {
        const { count, error } = await supabase
          .from("app_notifications")
          .select("id", { count: "exact", head: true })
          .is("read_at", null);
        if (!active || currentUserId !== userId) return;
        if (error) {
          console.error("No se pudo consultar el contador de notificaciones:", error);
          setNotificationError("No se pudieron actualizar las notificaciones.");
          if (pollingTimer === null) {
            pollingTimer = window.setInterval(() => void refresh(), 15000);
          }
          return;
        }
        setNotificationError("");
        setUnreadNotificationCount(count ?? 0);
      }

      channel = supabase
        .channel(`unread-app-notifications:${userId}`)
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
        .subscribe((status, error) => {
          if (!active || currentUserId !== userId) return;
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
            console.error("No se pudo sincronizar el contador de notificaciones:", error);
            setNotificationError("No se pudieron actualizar las notificaciones.");
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
        if (active) void watchNotifications(session?.user.id ?? null);
      }, 0);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        if (isMissingAuthSessionError(error)) {
          void watchNotifications(null);
          return;
        }
        console.error("No se pudo comprobar la sesión para las notificaciones:", error);
        setNotificationError("No se pudieron actualizar las notificaciones.");
        return;
      }
      void watchNotifications(data.session?.user.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
      if (pollingTimer !== null) window.clearInterval(pollingTimer);
    };
  }, []);

  const navItems: {
    id: NonNullable<Props["active"]>;
    label: string;
    href: string;
    icon: NavIconName;
  }[] = [
    { id: "carta", label: "Carta Natal", href: "/carta", icon: "carta" },
    { id: "destinos", label: "Destinos", href: "/destinos", icon: "destinos" },
    { id: "calendario", label: "Calendario astral", href: "/calendario", icon: "calendario" },
    { id: "mensajes", label: "Mensajes", href: "/mensajes", icon: "mensajes" },
    { id: "notificaciones", label: "Notificaciones", href: "/notificaciones", icon: "notificaciones" },
    { id: "cuenta", label: "Cuenta", href: "/cuenta", icon: "cuenta" },
  ];

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 w-full shadow-lg">
      <div className="mx-auto flex h-16 w-full max-w-7xl min-w-0 items-center px-3 sm:h-20 sm:justify-between sm:px-6">
        <Link 
          href="/carta" 
          className="hidden shrink-0 cursor-pointer items-center gap-3 transition group hover:scale-105 sm:flex"
          aria-label="AstraRed, ir a Carta Natal"
        >
          <BrandMark size="sm" />
        </Link>

        <nav aria-label="Navegación principal" className="flex w-full min-w-0 items-center justify-between gap-1 sm:w-auto sm:gap-3 md:gap-4">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={
                  "flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-xl px-2 py-3 text-sm font-semibold shadow-sm transition sm:flex-none sm:gap-2 sm:px-3 md:px-4 " +
                  (isActive
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950/60"
                    : "text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/60") +
                  " focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                }
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative">
                  <NavIcon name={item.icon} />
                  {item.id === "mensajes" && unreadCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-3 -top-2 grid h-5 min-w-5 place-items-center rounded-full border border-slate-950 bg-lime-400 px-1 text-[10px] font-bold leading-none text-slate-950 shadow-[0_0_10px_rgba(163,230,53,0.65)]"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  {item.id === "notificaciones" && unreadNotificationCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-3 -top-2 grid h-5 min-w-5 place-items-center rounded-full border border-slate-950 bg-rose-400 px-1 text-[10px] font-bold leading-none text-slate-950 shadow-[0_0_10px_rgba(251,113,133,0.6)]"
                    >
                      {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                    </span>
                  )}
                </span>
                <span className="sr-only sm:not-sr-only">{item.label}</span>
                {item.id === "mensajes" && (
                  <span className="sr-only" role="status" aria-live="polite">
                    {unreadError ||
                      (unreadCount > 0
                        ? `${unreadCount} mensajes sin leer`
                        : "")}
                  </span>
                )}
                {item.id === "notificaciones" && (
                  <span className="sr-only" role="status" aria-live="polite">
                    {notificationError ||
                      (unreadNotificationCount > 0
                        ? `${unreadNotificationCount} notificaciones sin leer`
                        : "")}
                  </span>
                )}
              </Link>
            );
          })}
          <a
            href="https://ko-fi.com/astrared"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Dona un café a AstraRed"
            title="Dona un café"
            className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-thread/40 px-2 py-3 text-sm font-semibold text-[#f0d9e2] shadow-sm transition hover:border-thread hover:bg-thread/10 sm:min-w-0 sm:px-3 md:px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.7"
            >
              <path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
              <path d="M17 10h1a3 3 0 1 1 0 6h-1M8 4c1 1 1 2 0 3m5-3c1 1 1 2 0 3M4 22h15" />
            </svg>
            <span className="sr-only sm:not-sr-only">Dona un café</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
