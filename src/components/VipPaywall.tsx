"use client";

import Link from "next/link";

interface VipPaywallProps {
  name: string;
  onClose?: () => void;
}

export function VipPaywall({ name, onClose }: VipPaywallProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="vip-paywall-title"
        className="relative my-auto w-full max-w-lg space-y-6 rounded-3xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl sm:p-8"
      >
        <div className="inline-flex rounded-full border border-thread/30 bg-thread/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#f0d9e2]">
          Promoción de inauguración
        </div>

        <div className="space-y-2">
          <h2
            id="vip-paywall-title"
            className="font-serif text-2xl font-bold text-white sm:text-3xl"
          >
            {name}, tu espacio está abierto
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-300">
            La promoción de inauguración ofrece un mes sin costo. Después, el
            Calendario astral y Hilo Rojo requerirán VIP. Los planes serán USD
            4.99/mes o USD 34.99/año. Cada periodo será un pago único, sin
            renovación automática. Las compras se habilitarán posteriormente.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-left text-sm text-slate-200">
          <p>
            <span className="mr-2 font-bold text-thread" aria-hidden="true">✓</span>
            Carta natal y exploración de afinidades.
          </p>
          <p>
            <span className="mr-2 font-bold text-thread" aria-hidden="true">✓</span>
            Calendario astral y fases lunares (VIP después de la promoción).
          </p>
          <p>
            <span className="mr-2 font-bold text-thread" aria-hidden="true">✓</span>
            Hilo Rojo (VIP después de la promoción) y mensajes cuando existe
            interés mutuo.
          </p>
        </div>

        <div className="space-y-3">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full bg-thread px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e61f53]"
            >
              Seguir explorando
            </button>
          ) : (
            <Link
              href="/cuenta"
              className="block w-full rounded-full bg-thread px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e61f53]"
            >
              Ir a mi cuenta
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
