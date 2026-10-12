"use client";

import { useState } from "react";
import Link from "next/link";

interface VipPaywallProps {
  name: string;
  onClose?: () => void;
}

type Plan = "monthly" | "annual";

export function VipPaywall({ name, onClose }: VipPaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("annual");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="vip-paywall-title"
        className="relative my-auto w-full max-w-lg space-y-6 rounded-3xl border border-amber-400/40 bg-gradient-to-b from-slate-900 via-purple-950/60 to-slate-950 p-6 text-center shadow-2xl sm:p-8"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-lg">
          <span aria-hidden="true">✦</span> AstraRed VIP
        </div>

        <div className="space-y-2">
          <h2
            id="vip-paywall-title"
            className="font-serif text-2xl font-bold text-white sm:text-3xl"
          >
            {name}, desbloquea tu Calendario VIP
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-300">
            Elige tu suscripción para disfrutar del calendario de efemérides y
            planificación astral.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-left text-sm text-slate-200">
          <p>
            <span className="mr-2 font-bold text-amber-400" aria-hidden="true">
              ✓
            </span>
            Calendario de efemérides y fases lunares.
          </p>
          <p>
            <span className="mr-2 font-bold text-amber-400" aria-hidden="true">
              ✓
            </span>
            Planificación de fechas según tus intereses.
          </p>
          <p>
            <span className="mr-2 font-bold text-amber-400" aria-hidden="true">
              ✓
            </span>
            Alertas de Hilo Rojo al encontrar compatibilidad del 100% entre dos
            perfiles VIP.
          </p>
          <p>
            <span className="mr-2 font-bold text-amber-400" aria-hidden="true">
              ✓
            </span>
            Acceso a las herramientas astrales VIP.
          </p>
        </div>

        <fieldset className="grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
          <legend className="sr-only">Elige un plan de suscripción</legend>
          <label
            className={`relative cursor-pointer rounded-2xl border-2 p-4 transition focus-within:ring-2 focus-within:ring-amber-300 ${
              selectedPlan === "monthly"
                ? "border-amber-400 bg-amber-400/10"
                : "border-slate-700 bg-slate-900/70 hover:border-slate-500"
            }`}
          >
            <input
              type="radio"
              name="vip-plan"
              value="monthly"
              checked={selectedPlan === "monthly"}
              onChange={() => setSelectedPlan("monthly")}
              className="sr-only"
            />
            <span className="block text-xs font-bold uppercase tracking-wide text-slate-300">
              Mensual
            </span>
            <span className="mt-2 block font-serif text-3xl font-black text-amber-300">
              $4.99
            </span>
            <span className="text-xs text-slate-400">por mes</span>
          </label>

          <label
            className={`relative cursor-pointer rounded-2xl border-2 p-4 transition focus-within:ring-2 focus-within:ring-amber-300 ${
              selectedPlan === "annual"
                ? "border-amber-400 bg-amber-400/10"
                : "border-slate-700 bg-slate-900/70 hover:border-slate-500"
            }`}
          >
            <input
              type="radio"
              name="vip-plan"
              value="annual"
              checked={selectedPlan === "annual"}
              onChange={() => setSelectedPlan("annual")}
              className="sr-only"
            />
            <span className="absolute -right-2 -top-2 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase text-slate-950">
              Ahorra 42%
            </span>
            <span className="block text-xs font-bold uppercase tracking-wide text-slate-300">
              Anual
            </span>
            <span className="mt-2 block font-serif text-3xl font-black text-amber-300">
              $34.99
            </span>
            <span className="text-xs text-slate-400">por año</span>
          </label>
        </fieldset>

        <div className="space-y-3">
          <p
            role="status"
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs leading-5 text-slate-300"
          >
            Estamos preparando el pago seguro. Todavía no se realizará ningún
            cobro ni se activará VIP desde esta pantalla.
          </p>
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 opacity-60 shadow-xl"
          >
            Suscripción próximamente ·{" "}
            {selectedPlan === "monthly" ? "$4.99/mes" : "$34.99/año"}
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="block w-full py-2.5 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              Volver a mi cuenta
            </button>
          ) : (
            <Link
              href="/cuenta"
              className="block w-full py-2.5 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              Volver a mi cuenta
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
