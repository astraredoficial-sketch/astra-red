"use client";

import React from "react";
import Link from "next/link";

interface Props {
  active?: "carta" | "destinos" | "calendario" | "mensajes" | "cuenta";
}

export function AppNav({ active }: Props) {
  const navItems = [
    { id: "carta", label: "Carta Natal", href: "/carta", icon: "✨" },
    { id: "destinos", label: "Destinos", href: "/destinos", icon: "🔥" },
    { id: "calendario", label: "Calendario VIP", href: "/calendario", icon: "⭐" },
    { id: "mensajes", label: "Mensajes", href: "/mensajes", icon: "💬" },
    { id: "cuenta", label: "Cuenta", href: "/cuenta", icon: "👤" },
  ];

  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 w-full shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link 
          href="/carta" 
          className="flex items-center gap-3 cursor-pointer group transition transform hover:scale-105"
        >
          <span className="text-3xl transition group-hover:rotate-12">✨</span>
          <span className="font-serif font-bold text-2xl text-white tracking-wide">
            Astra<span className="text-rose-500 group-hover:text-rose-400 transition">Red</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-4">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={
                  "px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm " +
                  (isActive
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950/60"
                    : "text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800/60")
                }
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
