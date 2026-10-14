"use client";

import Image from "next/image";
import Link from "next/link";
import type { UserProfile } from "@/lib/types";

interface VipConnectionAlertProps {
  me: UserProfile;
  other: UserProfile;
  onClose: () => void;
}

function ProfilePortrait({ profile }: { profile: UserProfile }) {
  return (
    <div className="grid size-28 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-amber-300/70 bg-slate-950 text-4xl font-serif text-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.22)] sm:size-36">
      {profile.avatarUrl ? (
        <Image
          src={profile.avatarUrl}
          alt={`Foto de perfil de ${profile.name}`}
          width={144}
          height={144}
          unoptimized
          className="size-full object-cover"
        />
      ) : (
        profile.name.trim().charAt(0).toUpperCase() || "A"
      )}
    </div>
  );
}

export function VipConnectionAlert({
  me,
  other,
  onClose,
}: VipConnectionAlertProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="vip-connection-title"
        className="relative my-auto w-full max-w-xl space-y-6 rounded-3xl border border-amber-300/50 bg-[radial-gradient(ellipse_at_top,rgba(120,53,15,0.26),transparent_52%),linear-gradient(160deg,#111827,#080817_65%)] p-6 text-center shadow-[0_0_50px_rgba(244,63,94,0.2)] sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar alerta de conexión"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/15 text-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          ×
        </button>

        <div className="space-y-2 pr-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-300 sm:text-xs">
            Hilo Rojo · Afinidad mutua
          </p>
          <h2
            id="vip-connection-title"
            className="font-serif text-3xl font-bold text-amber-100 sm:text-4xl"
          >
            Conexión de Hilo Rojo
          </h2>
          <p className="text-sm text-rose-200">
            ¡Compatibilidad astral del 100%!
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-6">
          <div className="min-w-0 space-y-2">
            <ProfilePortrait profile={me} />
            <p className="truncate text-sm font-semibold text-white">{me.name}</p>
          </div>
          <span
            aria-hidden="true"
            className="shrink-0 text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.8)]"
          >
            <svg
              className="size-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.8 8.8c0 5.1-8.8 10-8.8 10s-8.8-4.9-8.8-10a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2Z"
              />
            </svg>
          </span>
          <div className="min-w-0 space-y-2">
            <ProfilePortrait profile={other} />
            <p className="truncate text-sm font-semibold text-white">
              {other.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
          {[me, other].map((profile) => (
            <div key={profile.id} className="space-y-1 text-xs">
              <p className="font-semibold text-amber-200">{profile.name}</p>
              <p className="text-slate-300">
                Sol {profile.chart.triad.sun.sign}
              </p>
              {!profile.chart.timeUnknown && (
                <>
                  <p className="text-slate-300">
                    Luna {profile.chart.triad.moon.sign}
                  </p>
                  <p className="text-slate-300">
                    Ascendente {profile.chart.triad.asc.sign}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

        <p className="text-sm leading-6 text-slate-300">
          La lectura astrológica muestra una afinidad destacada. Explora los
          aspectos que sus cartas comparten.
        </p>

        <div className="space-y-3">
          <Link
            href={`/conectar/${other.id}`}
            className="block rounded-full border border-amber-200/80 bg-gradient-to-r from-rose-800 via-rose-700 to-amber-700 px-5 py-3 text-sm font-bold text-amber-50 shadow-[0_0_22px_rgba(244,63,94,0.35)] transition hover:brightness-110"
          >
            Ver conexión y detalles astrales
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-400 transition hover:text-white"
          >
            Seguir explorando
          </button>
        </div>
      </section>
    </div>
  );
}
