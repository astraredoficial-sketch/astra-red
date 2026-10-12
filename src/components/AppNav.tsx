"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/lib/supabase/client";

interface Props {
  active?: "carta" | "destinos" | "calendario" | "mensajes" | "cuenta";
}

export function AppNav({ active }: Props) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadError, setUnreadError] = useState("");

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function watchUnreadMessages(userId: string | null) {
      if (currentUserId === userId && (channel || !userId)) return;
      currentUserId = userId;
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
      setUnreadCount(0);
      setUnreadError("");
      if (!userId) return;
      let refreshVersion = 0;

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
            void refreshUnreadCount();
            return;
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error("No se pudo actualizar el contador de mensajes:", error);
            setUnreadError("No se pudieron actualizar los mensajes sin leer.");
          }
        });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (active) void watchUnreadMessages(session?.user.id ?? null);
      }, 0);
    });

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error("No se pudo verificar la sesión para los mensajes:", error);
        setUnreadError("No se pudieron actualizar los mensajes sin leer.");
        return;
      }
      void watchUnreadMessages(data.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  const navItems = [
    { id: "carta", label: "Carta Natal", href: "/carta", icon: "✨" },
    { id: "destinos", label: "Destinos", href: "/destinos", icon: "🔥" },
    { id: "calendario", label: "Calendario astral", href: "/calendario", icon: "🌙" },
    { id: "mensajes", label: "Mensajes", href: "/mensajes", icon: "💬" },
    { id: "cuenta", label: "Cuenta", href: "/cuenta", icon: "👤" },
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
                  "flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-xl px-2 py-2.5 text-sm font-semibold shadow-sm transition sm:flex-none sm:gap-2 sm:px-3 md:px-4 " +
                  (isActive
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950/60"
                    : "text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/60")
                }
              >
                <span className="relative text-base">
                  {item.icon}
                  {item.id === "mensajes" && unreadCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-3 -top-2 grid h-5 min-w-5 place-items-center rounded-full border border-slate-950 bg-lime-400 px-1 text-[10px] font-bold leading-none text-slate-950 shadow-[0_0_10px_rgba(163,230,53,0.65)]"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
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
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
