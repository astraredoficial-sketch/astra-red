"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { useSession } from "@/hooks/useSession";
import { findNextLunarReturn } from "@/lib/lunarReturn";

function formatInstant(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone,
  }).format(instant);
}

function formatShortDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(instant);
}

export function CicloPersonalUi() {
  const router = useRouter();
  const { ready, me, store, error: sessionError } = useSession();
  const [currentInstant, setCurrentInstant] = useState<Date | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const [activeCareTab, setActiveCareTab] = useState("alcohol");
  const [cycleDetailsOpen, setCycleDetailsOpen] = useState(false);

  const referenceTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );

  const userId = me?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    const initialTick = window.setTimeout(() => {
      setCurrentInstant(new Date());
    }, 0);

    const interval = window.setInterval(() => {
      setCurrentInstant(new Date());
    }, 30_000);

    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, [userId]);

  const lunarReturn = useMemo(() => {
    if (!me || !currentInstant) return null;

    const natalMoonLongitude = me.chart.triad.moon.longitude;

    if (
      typeof natalMoonLongitude !== "number" ||
      !Number.isFinite(natalMoonLongitude) ||
      natalMoonLongitude < 0 ||
      natalMoonLongitude >= 360
    ) {
      return {
        instant: null as Date | null,
        error: "No encontramos una longitud lunar natal válida.",
        days: 0,
        hours: 0,
        minutes: 0,
      };
    }

    try {
      const instant = findNextLunarReturn(
        natalMoonLongitude,
        currentInstant,
      );

      if (
        !(instant instanceof Date) ||
        !Number.isFinite(instant.getTime()) ||
        instant.getTime() <= currentInstant.getTime()
      ) {
        throw new Error("El cálculo no devolvió un retorno futuro válido.");
      }

      const totalMinutes = Math.floor(
        (instant.getTime() - currentInstant.getTime()) / 60_000,
      );

      return {
        instant,
        error: "",
        days: Math.floor(totalMinutes / 1440),
        hours: Math.floor((totalMinutes % 1440) / 60),
        minutes: totalMinutes % 60,
      };
    } catch {
      return {
        instant: null as Date | null,
        error: "No pudimos calcular el próximo retorno lunar. Inténtalo de nuevo más tarde.",
        days: 0,
        hours: 0,
        minutes: 0,
      };
    }
  }, [currentInstant, me]);

  useEffect(() => {
    if (!ready || sessionError || me) return;

    router.replace(
      store?.currentUserId ? "/onboarding" : "/acceso?mode=login",
    );
  }, [me, ready, router, sessionError, store?.currentUserId]);

  useEffect(() => {
    if (!shareMessage) return;

    const timeout = window.setTimeout(() => setShareMessage(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [shareMessage]);

  const handleShare = useCallback(async () => {
    if (!lunarReturn?.instant) return;

    const message = [
      "Mi próximo retorno lunar — AstraRed",
      formatInstant(lunarReturn.instant, referenceTimeZone),
      "Una pausa para escucharme, revisar mis emociones y volver a mi centro.",
      "https://astrared.vip",
    ].join("\n");

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "Mi próximo retorno lunar",
          text: message,
          url: "https://astrared.vip",
        });
        setShareMessage("Listo para compartir.");
      } else {
        await navigator.clipboard.writeText(message);
        setShareMessage("Información copiada al portapapeles.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      try {
        await navigator.clipboard.writeText(message);
        setShareMessage("Información copiada al portapapeles.");
      } catch {
        setShareMessage("No se pudo compartir. Inténtalo desde un navegador compatible.");
      }
    }
  }, [lunarReturn, referenceTimeZone]);

  const handleDownloadReport = useCallback(async () => {
    if (!lunarReturn?.instant) {
      setShareMessage("El reporte estará disponible cuando se calcule el retorno.");
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const dateText = formatInstant(lunarReturn.instant, referenceTimeZone);

      doc.setFillColor(10, 9, 24);
      doc.rect(0, 0, 210, 297, "F");
      doc.setTextColor(240, 198, 116);
      doc.setFontSize(21);
      doc.text("AstraRed | Ciclo Personal", 18, 24);
      doc.setDrawColor(92, 76, 128);
      doc.line(18, 31, 192, 31);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.text("Tu próximo retorno lunar", 18, 45);
      doc.setFontSize(12);
      doc.text(doc.splitTextToSize(dateText, 170), 18, 56);

      doc.setTextColor(190, 190, 210);
      doc.setFontSize(10);
      const reportLines = [
        "Una invitación simbólica a pausar, observar tus emociones",
        "y revisar tus hábitos de bienestar personal.",
        "",
        "Ideas para tu ciclo:",
        "- Reserva tiempo para descansar.",
        "- Anota tus emociones sin juzgarlas.",
        "- Mantén hábitos de hidratación y sueño adecuados.",
        "- Conversa con respeto y establece límites saludables.",
        "",
        "El retorno lunar es una referencia astrológica, no un",
        "indicador médico ni una predicción científica de salud.",
        "",
        `Zona horaria: ${referenceTimeZone}`,
        `Generado: ${new Date().toLocaleString("es")}`,
      ];

      doc.text(reportLines, 18, 78);
      doc.setTextColor(240, 198, 116);
      doc.text("AstraRed - Ciclo Personal", 18, 278);
      doc.save("AstraRed-Ciclo-Personal.pdf");
      setShareMessage("Tu reporte PDF se ha descargado.");
    } catch (error) {
      console.error("No se pudo generar el reporte PDF:", error);
      setShareMessage("No se pudo generar el PDF. Inténtalo de nuevo.");
    }
  }, [lunarReturn, referenceTimeZone]);
  return (
    <div className="starfield min-h-screen overflow-x-clip text-white">
      <AppNav active="ciclo-personal" />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <header className="rise relative mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#211333]/95 via-[#100d1d]/95 to-[#160c19]/95 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.28)] sm:mb-10 sm:p-10 lg:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl"
          />

          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto] md:gap-10">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-100/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-200 shadow-[0_0_10px_rgba(253,230,138,0.8)]" />
                Tu universo interior
              </div>

              <h1 className="max-w-2xl font-serif text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Tu tiempo.
                <span className="mt-1 block bg-gradient-to-r from-amber-100 via-rose-200 to-violet-200 bg-clip-text text-transparent">
                  Tu propio ritmo.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                Cada retorno lunar marca un encuentro simbólico con la posición
                de tu Luna natal. Regálate un momento para mirar hacia dentro y
                conectar con lo que necesitas.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="text-amber-200">✦</span>
                  Personalizado con tu carta natal
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="text-violet-200">☾</span>
                  Ciclo lunar
                </span>
              </div>
            </div>

            <div className="relative mx-auto flex h-48 w-48 items-center justify-center sm:h-60 sm:w-60">
              <div
                aria-hidden="true"
                className="absolute inset-2 rounded-full border border-violet-200/15"
              />
              <div
                aria-hidden="true"
                className="absolute inset-5 rounded-full border border-dashed border-amber-100/20"
              />
              <div
                aria-hidden="true"
                className="absolute h-36 w-36 rounded-full bg-violet-500/20 blur-2xl sm:h-44 sm:w-44"
              />
              <div
                aria-hidden="true"
                className="relative h-28 w-28 overflow-hidden rounded-full border border-amber-100/25 bg-gradient-to-br from-[#f8e9d0] via-[#c8b5d7] to-[#63537d] shadow-[0_0_55px_rgba(198,161,255,0.22)] sm:h-36 sm:w-36"
              >
                <div className="absolute -right-5 -top-3 h-32 w-32 rounded-full bg-[#171023] shadow-[-12px_8px_22px_rgba(13,8,25,0.35)] sm:h-40 sm:w-40" />
                <div className="absolute bottom-5 left-5 h-2 w-2 rounded-full bg-white/30 blur-[1px]" />
              </div>
              <span className="absolute right-7 top-8 text-lg text-amber-100/90 sm:right-9 sm:top-10">✦</span>
              <span className="absolute bottom-8 left-5 text-xs text-violet-200 sm:bottom-10 sm:left-7">✧</span>
              <span className="absolute right-6 bottom-12 h-1 w-1 rounded-full bg-rose-200 sm:right-8 sm:bottom-14" />
            </div>
          </div>
        </header>

        {!ready ? (
          <section
            className="rounded-3xl border border-white/10 bg-[#110e1c]/80 p-8 text-slate-300"
            role="status"
          >
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-violet-300/25 border-t-violet-200" />
              Preparando tu espacio personal…
            </div>
          </section>
        ) : sessionError ? (
          <section
            className="rounded-3xl border border-rose-300/20 bg-rose-950/30 p-6 text-rose-100"
            role="alert"
          >
            <h2 className="font-semibold">No pudimos verificar tu sesión</h2>
            <p className="mt-2 text-sm leading-6 text-rose-100/75">
              Recarga la página o vuelve a iniciar sesión para consultar tu ciclo.
            </p>
          </section>
        ) : !me ? (
          <section
            className="rounded-3xl border border-white/10 bg-[#110e1c]/80 p-6 text-slate-300"
            role="status"
          >
            Preparando tu sesión…
          </section>
        ) : null}

        <section
          aria-labelledby="vip-cycle-heading"
          className="relative mt-7 overflow-hidden rounded-[2rem] border border-amber-200/20 bg-gradient-to-br from-[#10172e]/95 via-[#100c20]/95 to-[#190d23]/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-8 lg:p-10"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-cyan-400/[0.08] blur-3xl" />

          <div className="relative">
            <div className="mb-7 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-200">AstraRed VIP · Bienestar simbólico</p>
              <h2 id="vip-cycle-heading" className="mt-3 font-serif text-2xl font-semibold text-white sm:text-3xl">
                Ciclo Personal y Cuidado Lunar
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Un espacio para observar tus ritmos, reconectar contigo y preparar tu próximo retorno lunar.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div className="flex flex-col items-center rounded-3xl border border-amber-200/20 bg-black/20 p-5 text-center sm:p-7">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200/30 bg-amber-200/[0.07] text-4xl text-amber-100 shadow-[0_0_30px_rgba(240,198,116,0.12)]">
                  ☾
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-200">Próximo retorno lunar</p>
                {lunarReturn?.instant ? (
                  <>
                    <p className="mt-2 text-lg font-semibold leading-7 text-white">
                      {formatInstant(lunarReturn.instant, referenceTimeZone)}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Hora local · {referenceTimeZone}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-300" role="status">
                    {lunarReturn?.error || "Calculando tu retorno…"}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-[#070a14]/60 p-5 sm:flex-row sm:p-7">
                <div className="relative h-36 w-36 shrink-0">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label="Progreso aproximado del ciclo lunar">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#202642" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke="#f0c674" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray="314.16"
                      strokeDashoffset={lunarReturn?.instant ? 314.16 * (1 - Math.max(0, Math.min(100, 100 - ((lunarReturn.days * 1440 + lunarReturn.hours * 60 + lunarReturn.minutes) / (29.53059 * 1440)) * 100)) / 100) : 314.16}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl text-amber-100">☾</span>
                    <span className="mt-1 text-xl font-bold tabular-nums text-white">
                      {lunarReturn?.instant
                        ? `${Math.round(Math.max(0, Math.min(100, 100 - ((lunarReturn.days * 1440 + lunarReturn.hours * 60 + lunarReturn.minutes) / (29.53059 * 1440)) * 100)))}%`
                        : "—"}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400">Estimado</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200 sm:text-left">Cuenta regresiva</p>
                  <p className="mt-1 text-center text-sm text-slate-400 sm:text-left">Tiempo restante hasta el retorno</p>
                  {lunarReturn?.instant ? (
                    <div className="mt-4 grid w-full grid-cols-3 gap-2">
                      {[
                        { value: lunarReturn.days, label: "Días" },
                        { value: lunarReturn.hours, label: "Horas" },
                        { value: lunarReturn.minutes, label: "Minutos" },
                      ].map((unit) => (
                        <div key={unit.label} className="rounded-xl border border-amber-200/20 bg-[#0b1021] px-1 py-3 text-center">
                          <span className="block font-serif text-2xl font-bold tabular-nums text-white sm:text-3xl">{String(unit.value).padStart(2, "0")}</span>
                          <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-amber-200">{unit.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-400">El contador aparecerá cuando el cálculo esté disponible.</p>
                  )}
                  <p className="mt-3 text-[10px] leading-5 text-slate-500">Porcentaje orientativo basado en un mes sinódico medio; no representa una medición astronómica exacta del progreso.</p>
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-100/25 bg-amber-100/[0.07] px-5 py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-100/45 hover:bg-amber-100/[0.12] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-100 sm:w-auto"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4" />
                    </svg>
                    Compartir mi retorno
                  </button>

                  {shareMessage && (
                    <p className="mt-3 text-sm text-violet-200" role="status" aria-live="polite">
                      {shareMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.04] p-4">
              <span aria-hidden="true" className="text-xl text-cyan-200">✧</span>
              <p className="text-xs leading-6 text-slate-300">
                El retorno se calcula con la longitud lunar de tu carta natal. La astrología es una práctica simbólica y no determina tu estado físico o emocional.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="care-window-heading" className="relative mt-6 overflow-hidden rounded-3xl border border-amber-200/20 border-l-4 border-l-amber-300 bg-[#10172e]/80 p-5 backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200/20 bg-amber-200/[0.07] text-xl text-amber-200">✧</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">Pausa consciente</p>
              <h2 id="care-window-heading" className="font-serif text-xl font-semibold text-white">Ventana de cuidado de 48 horas</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Puedes usar las horas cercanas a tu retorno como recordatorio personal para bajar el ritmo, revisar tus necesidades y tratarte con amabilidad. Esta ventana es una propuesta de reflexión, no una alerta médica ni una predicción de sensibilidad.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3" role="group" aria-label="Temas de cuidado personal">
            <button type="button" aria-pressed={activeCareTab === "alcohol"} onClick={() => setActiveCareTab("alcohol")} className={`rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${activeCareTab === "alcohol" ? "border-amber-200/60 bg-amber-200/[0.08]" : "border-white/10 bg-black/20 hover:border-amber-200/30"}`}>
              <span className="text-xl">◇</span>
              <span className="mt-2 block text-sm font-semibold text-white">Alcohol y hábitos</span>
              <span className="mt-1 block text-xs text-slate-400">Decisiones conscientes</span>
            </button>
            <button type="button" aria-pressed={activeCareTab === "intimacy"} onClick={() => setActiveCareTab("intimacy")} className={`rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${activeCareTab === "intimacy" ? "border-fuchsia-200/60 bg-fuchsia-300/[0.08]" : "border-white/10 bg-black/20 hover:border-fuchsia-200/30"}`}>
              <span className="text-xl text-fuchsia-200">♡</span>
              <span className="mt-2 block text-sm font-semibold text-white">Intimidad y vínculos</span>
              <span className="mt-1 block text-xs text-slate-400">Comunicación respetuosa</span>
            </button>
            <button type="button" aria-pressed={activeCareTab === "body"} onClick={() => setActiveCareTab("body")} className={`rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${activeCareTab === "body" ? "border-emerald-200/60 bg-emerald-300/[0.08]" : "border-white/10 bg-black/20 hover:border-emerald-200/30"}`}>
              <span className="text-xl text-emerald-200">✿</span>
              <span className="mt-2 block text-sm font-semibold text-white">Cuerpo y descanso</span>
              <span className="mt-1 block text-xs text-slate-400">Rutinas amables</span>
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#070a14]/70 p-5" aria-live="polite">
            {activeCareTab === "alcohol" && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-200">Hábitos conscientes</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Observa cómo te sientes y decide con anticipación qué hábitos quieres cuidar. Si bebes alcohol, evita conducir y considera que la opción más segura es no beber; no existe evidencia de que el retorno lunar cambie el metabolismo.</p>
              </div>
            )}
            {activeCareTab === "intimacy" && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-200">Vínculos y comunicación</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Date permiso para escuchar antes de responder. Si una conversación se vuelve tensa, puedes proponer una pausa y retomarla cuando ambas partes estén preparadas. No necesitas posponer decisiones importantes por una fase lunar.</p>
              </div>
            )}
            {activeCareTab === "body" && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Descanso y autocuidado</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Prioriza un horario de sueño razonable, agua según tus necesidades y una actividad relajante que disfrutes. Si llevas un diario, anota cómo te sientes sin asumir que la Luna es la causa.</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => setCycleDetailsOpen((open) => !open)} aria-expanded={cycleDetailsOpen} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b88d3b] via-[#f0c674] to-[#ffe094] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#070a14] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-100">
              {cycleDetailsOpen ? "Ocultar análisis" : "Ver análisis y reporte"}
              <span aria-hidden="true">{cycleDetailsOpen ? "⌃" : "⌄"}</span>
            </button>
            <button type="button" onClick={() => void handleShare()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-200/30 bg-black/20 px-5 py-3 text-xs font-semibold text-white transition hover:border-amber-200/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-100">
              Compartir retorno
            </button>
          </div>

          {cycleDetailsOpen && (
            <div className="mt-5 space-y-4 rounded-2xl border border-violet-200/20 bg-[#070a14]/75 p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">Tu referencia astrológica</p>
                <h3 className="mt-2 font-serif text-xl font-semibold text-white">Análisis del retorno lunar</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Este cálculo identifica cuándo la Luna vuelve aproximadamente a la longitud de tu Luna natal. Para interpretar casas y aspectos hacen falta cálculos adicionales con datos natales completos; no mostramos posiciones inventadas.</p>
              </div>
              <div className="rounded-xl border border-amber-200/15 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">Reporte personal en PDF</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Incluye la fecha calculada, la zona horaria y una guía de reflexión personal.</p>
                <button type="button" disabled={!lunarReturn?.instant} onClick={() => void handleDownloadReport()} className="mt-4 min-h-11 rounded-xl border border-amber-200/30 bg-amber-200/[0.08] px-4 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-200/[0.15] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-100">
                  Descargar PDF
                </button>
              </div>
            </div>
          )}
          {shareMessage && <p className="mt-4 text-sm text-violet-200" role="status" aria-live="polite">{shareMessage}</p>}
        </section>
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="feature-card rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-200/20 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-200/15 bg-violet-300/[0.08] text-xl text-violet-200">
              ☽
            </div>
            <h2 className="mt-5 font-serif text-xl font-semibold text-white">
              Escucha
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Haz una pausa y pregúntate qué emoción necesita hoy más atención.
            </p>
          </article>

          <article className="feature-card rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:border-rose-200/20 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200/15 bg-rose-300/[0.08] text-xl text-rose-200">
              ✧
            </div>
            <h2 className="mt-5 font-serif text-xl font-semibold text-white">
              Reconecta
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Identifica los hábitos que te hacen bien y aquellos que quieres cambiar.
            </p>
          </article>

          <article className="feature-card rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:border-amber-100/20 sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-100/15 bg-amber-100/[0.07] text-xl text-amber-100">
              ✦
            </div>
            <h2 className="mt-5 font-serif text-xl font-semibold text-white">
              Intenciona
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Elige una pequeña acción que quieras cultivar durante el próximo ciclo.
            </p>
          </article>
        </section>

        <section className="relative mt-6 overflow-hidden rounded-3xl border border-amber-100/15 bg-gradient-to-r from-[#21172a]/90 via-[#171322]/90 to-[#21151f]/90 p-6 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-amber-200/[0.06] blur-3xl"
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-100/15 bg-amber-100/[0.07] text-2xl text-amber-100">
              ✧
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-200/80">
                Un momento para ti
              </p>
              <h2 className="mt-2 font-serif text-2xl font-medium text-white sm:text-3xl">
                ¿Qué quieres dejar ir y qué deseas nutrir?
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                Puedes usar tu retorno lunar como una invitación a escribir,
                descansar, ordenar tus prioridades o expresar gratitud. No
                necesitas hacerlo perfecto: basta con dedicarte unos minutos.
              </p>
            </div>
          </div>
        </section>

        <footer className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-xs leading-6 text-slate-500">
            La astrología es una tradición simbólica y no una herramienta
            científica de predicción. Utiliza este espacio como apoyo para
            la reflexión personal, no como sustituto de orientación profesional.
          </p>
        </footer>
      </main>
    </div>
  );
}
