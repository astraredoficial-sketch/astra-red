"use client";

import React from "react";
import Link from "next/link";

interface VipPaywallModalProps {
  userName?: string;
  onUpgrade: () => void;
  onClose?: () => void;
  showBackToCuentaLink?: boolean;
}

export function VipPaywallModal({
  userName = "Usuario",
  onUpgrade,
  onClose,
  showBackToCuentaLink = false,
}: VipPaywallModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-slate-900 via-purple-950/60 to-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative">
        
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
          <span>⭐</span> ACCESO RESTRINGIDO A PLAN FREE
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">
            Hola {userName}, Desbloquea tu VIP
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Tu cuenta actualmente está en el <span className="text-rose-400 font-bold">Plan Free</span>. Suscríbete a Astra Red VIP para calcular efemérides astronómicas exactas.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="text-amber-400 font-bold">✓</span>
            <span>Motor de Búsqueda Científico de Efemérides Celestiales.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="text-amber-400 font-bold">✓</span>
            <span>Notificaciones de Alertas Activas ilimitadas.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <span className="text-amber-400 font-bold">✓</span>
            <span>Análisis ilimitado de Sinastría Cósmica VIP.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-3.5 flex flex-col justify-between text-left relative shadow-xl">
            <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase absolute -top-2.5 right-3">
              Recomendado
            </span>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Plan Mensual</span>
              <span className="text-2xl font-black font-serif text-amber-300">$4.99 <span className="text-xs font-normal text-slate-400">/ mes</span></span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between text-left opacity-80 hover:opacity-100 transition">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Plan Anual</span>
              <span className="text-2xl font-black font-serif text-white">$39.99 <span className="text-xs font-normal text-slate-400">/ año</span></span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onUpgrade}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 hover:opacity-90 text-slate-950 font-extrabold rounded-2xl transition shadow-xl uppercase tracking-wider text-xs cursor-pointer transform hover:scale-[1.02]"
          >
            ⭐ Suscribirme Ahora ($4.99/mes)
          </button>

          {showBackToCuentaLink ? (
            <Link
              href="/cuenta"
              className="block w-full py-2.5 text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              Volver a la sección Cuenta
            </Link>
          ) : (
            onClose && (
              <button
                onClick={onClose}
                className="block w-full py-2.5 text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Cerrar
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
