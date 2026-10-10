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
    <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          href="/carta" 
          className="flex items-center gap-2.5 cursor-pointer group transition transform hover:scale-105"
        >
          <span className="text-2xl transition group-hover:rotate-12">✨</span>
          <span className="font-serif font-bold text-lg text-white tracking-wide">
            Astra<span className="text-rose-500 group-hover:text-rose-400 transition">Red</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer " +
                  (isActive
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900")
                }
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
