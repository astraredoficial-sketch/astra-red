"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "next/cache";
import { AppNav } from "@/components/AppNav";

import {
  ASTRAL_ACTIVITIES,
  type AstralActivity,
  type AstralCalendarDay,
  type AstralCalculationResult,
  calculateCurrentSky,
  findOptimalAstralDates,
  getDateKeyInTimeZone,
  getAstralCalendarDays,
  type CurrentSkyReading,
} from "@/lib/astronomyEngine";
import { describeAspect, formatArcMinutes } from "@/lib/astro/aspects";
import { ASPECT_META, PLANET_META } from "@/lib/astro/constants";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabase/client";

interface AstralEvent {
  id: string;
  title: string;
  activity: AstralActivity;
  eventDate: string;
  referenceTimeZone: string;
  lunarPhase: string;
  illumination: number;
  recommendation: string;
}

const ACTIVITY_LABELS: Record<AstralActivity, string> = {
  "hair-growth": "Corte de cabello · favorecer crecimiento",
  "hair-maintenance": "Corte de cabello · conservar la forma",
  planting: "Siembra",
  "pruning-harvest": "Poda y cosecha",
  "moon-observation": "Observación lunar",
  "home-search": "Buscar casa o apartamento",
  "home-purchase": "Comprar o firmar por una vivienda",
  "home-move": "Mudanza o estreno del hogar",
  "vehicle-purchase": "Comprar carro o moto",
  "vehicle-first-drive": "Primer viaje en carro o moto",
  engagement: "Compromiso",
  wedding: "Casamiento",
  "business-launch": "Iniciar un negocio o proyecto",
  "job-interview": "Entrevista o inicio de empleo",
  travel: "Iniciar un viaje",
  "contract-signing": "Firmar un contrato o acuerdo",
};

const ACTIVITY_GROUPS: {
  label: string;
  activities: AstralActivity[];
}[] = [
  {
    label: "Hogar y compras importantes",
    activities: ["home-search", "home-purchase", "home-move"],
  },
  {
    label: "Vehículos y viajes",
    activities: ["vehicle-purchase", "vehicle-first-drive", "travel"],
  },
  {
    label: "Amor y relaciones",
    activities: ["engagement", "wedding"],
  },
  {
    label: "Trabajo y proyectos",
    activities: ["business-launch", "job-interview", "contract-signing"],
  },
  {
    label: "Cuidado personal y naturaleza",
    activities: [
      "hair-growth",
      "hair-maintenance",
      "planting",
      "pruning-harvest",
      "moon-observation",
    ],
  },
];

const EVENT_COLUMNS =
  "id, user_id, title, activity, event_date, reference_timezone, lunar_phase, illumination, recommendation";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ASTRAL_ACTIVITY_SET = new Set<string>(ASTRAL_ACTIVITIES);

function isAstralActivity(value: unknown): value is AstralActivity {
  return typeof value === "string" && ASTRAL_ACTIVITY_SET.has(value);
}

function toAstralEvent(value: unknown): AstralEvent | null {
  if (value === null || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    typeof row.title !== "string" ||
    !isAstralActivity(row.activity) ||
    typeof row.event_date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(row.event_date) ||
    typeof row.reference_timezone !== "string" ||
    !row.reference_timezone.trim() ||
    typeof row.lunar_phase !== "string" ||
    typeof row.illumination !== "number" ||
    !Number.isInteger(row.illumination) ||
    row.illumination < 0 ||
    row.illumination > 100 ||
    typeof row.recommendation !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    activity: row.activity,
    eventDate: row.event_date,
    referenceTimeZone: row.reference_timezone,
    lunarPhase: row.lunar_phase,
    illumination: row.illumination,
    recommendation: row.recommendation,
  };
}

function formatCurrentInstant(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone,
  }).format(instant);
}

function getCurrentSkyError(cause: unknown): string {
  return cause instanceof Error
    ? `No se pudo calcular tu cielo actual: ${cause.message}`
    : "No se pudo calcular tu cielo actual.";
}

function getInitialCalendarContext(): {
  instant: Date;
  timeZone: string;
  date: string;
} {
  const instant = new Date();
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return {
    instant,
    timeZone,
    date: getDateKeyInTimeZone(instant, timeZone),
  };
}

function createDailyReflection(reading: CurrentSkyReading): {
  text: string;
  question: string;
} {
  const closestAspect = reading.aspects[0];
  if (!closestAspect) {
    return {
      text: "En esta lectura no aparecen contactos principales cerrados entre los tránsitos consultados y tus puntos natales. Es una observación limitada a los aspectos y al orbe definidos, no una señal de que el día carezca de significado.",
      question: "¿Qué merece hoy tu atención, más allá de cualquier pronóstico?",
    };
  }

  const transitName = PLANET_META[closestAspect.transit].name;
  const natalName = PLANET_META[closestAspect.natal].name;
  const transit = reading.transits.find(
    (item) => item.id === closestAspect.transit,
  );
  if (!transit) {
    throw new Error("No se encontró el tránsito de la lectura destacada.");
  }

  return {
    text: `${transitName} en ${transit.sign} forma un aspecto de ${ASPECT_META[closestAspect.aspect].name} con tu ${natalName} natal (orbe ${formatArcMinutes(closestAspect.orb)}). ${describeAspect(closestAspect.aspect)}`,
    question: `¿Cómo puedes atender hoy el tema de ${natalName.toLocaleLowerCase()} con intención y calma?`,
  };
}

function formatAstralDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(new Date(`${date}T12:00:00Z`));
}

function getMoonSymbol(phaseName: string): string {
  if (phaseName === "Luna nueva") return "🌑";
  if (phaseName === "Luna creciente") return "🌒";
  if (phaseName === "Cuarto creciente") return "🌓";
  if (phaseName === "Luna gibosa creciente") return "🌔";
  if (phaseName === "Luna llena") return "🌕";
  if (phaseName === "Luna gibosa menguante") return "🌖";
  if (phaseName === "Cuarto menguante") return "🌗";
  return "🌘";
}

function isMonthValue(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function CalendarioUi() {
  use(io());
  const router = useRouter();
  const { ready, me, store, error: sessionError } = useSession();
  const [initialCalendarContext] = useState(getInitialCalendarContext);
  const [monthValue, setMonthValue] = useState(() =>
    initialCalendarContext.date.slice(0, 7),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    initialCalendarContext.date,
  );
  const [referenceTimeZone] = useState(initialCalendarContext.timeZone);
  const [currentInstant, setCurrentInstant] = useState<Date>(
    initialCalendarContext.instant,
  );
  const [activity, setActivity] = useState<AstralActivity>("hair-growth");
  const [savedEvents, setSavedEvents] = useState<AstralEvent[]>([]);
  const [eventsOwnerId, setEventsOwnerId] = useState("");
  const [eventsLoading, setEventsLoading] = useState(true);
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState("");
  const [actionError, setActionError] = useState("");

  const userId = me?.id;

  useEffect(() => {
    if (!userId) return;
    const interval = window.setInterval(
      () => setCurrentInstant(new Date()),
      60_000,
    );
    return () => window.clearInterval(interval);
  }, [userId]);

  const currentSky = useMemo(() => {
    if (!me) return null;
    try {
      return {
        reading: calculateCurrentSky(me.chart, currentInstant),
        error: "",
      };
    } catch (cause) {
      return { reading: null, error: getCurrentSkyError(cause) };
    }
  }, [currentInstant, me]);

  useEffect(() => {
    if (!ready || sessionError || me) return;
    router.replace(
      store?.currentUserId ? "/onboarding" : "/acceso?mode=login",
    );
  }, [me, ready, router, sessionError, store?.currentUserId]);

  useEffect(() => {
    if (!userId) return;
    const authenticatedUserId = userId;
    let active = true;

    async function loadEvents() {
      setEventsLoading(true);
      setCalendarError("");

      const { data, error } = await supabase
        .from("astral_events")
        .select(EVENT_COLUMNS)
        .eq("user_id", authenticatedUserId)
        .order("event_date", { ascending: true });

      if (!active) return;
      if (error) {
        setEventsOwnerId(authenticatedUserId);
        setCalendarError(
          `No se pudieron cargar tus fechas guardadas: ${error.message}`,
        );
        setEventsLoading(false);
        return;
      }

      const events = (data ?? [])
        .map(toAstralEvent)
        .filter((event): event is AstralEvent => event !== null);
      setSavedEvents(events);
      setEventsOwnerId(authenticatedUserId);
      if (events.length !== (data ?? []).length) {
        setCalendarError(
          "Algunas fechas guardadas tienen datos inválidos y no se pudieron mostrar.",
        );
      }
      setEventsLoading(false);
    }

    void loadEvents();
    return () => {
      active = false;
    };
  }, [userId]);

  const monthIsValid = isMonthValue(monthValue);
  const [year, month] = monthIsValid
    ? monthValue.split("-").map(Number)
    : [0, 0];

  const monthDate = monthIsValid
    ? new Date(`${monthValue}-01T12:00:00Z`)
    : null;
  const monthTitle = monthDate
    ? new Intl.DateTimeFormat("es", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(monthDate)
    : "";

  const calendarDays = useMemo(
    () =>
      monthIsValid
        ? getAstralCalendarDays(year, month, referenceTimeZone)
        : [],
    [monthIsValid, month, referenceTimeZone, year],
  );

  const recommendations = useMemo(
    () =>
      monthIsValid
        ? findOptimalAstralDates(
            activity,
            year,
            month,
            month,
            referenceTimeZone,
          )
        : [],
    [activity, monthIsValid, month, referenceTimeZone, year],
  );

  const selectedDay = calendarDays.find(
    (day) => `${monthValue}-${String(day.day).padStart(2, "0")}` === selectedDate,
  );
  const eventsAreForCurrentUser = eventsOwnerId === me?.id;

  function changeMonth(amount: number) {
    if (!monthIsValid) return;
    const nextMonth = new Date(`${monthValue}-01T12:00:00Z`);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + amount);
    const nextValue = nextMonth.toISOString().slice(0, 7);
    setMonthValue(nextValue);
    setSelectedDate(`${nextValue}-01`);
  }

  async function saveAstralDate(result: AstralCalculationResult) {
    if (!me) return;
    setSavingDate(result.date);
    setActionError("");

    const title = ACTIVITY_LABELS[activity];
    const { data, error } = await supabase
      .from("astral_events")
      .insert({
        user_id: me.id,
        title,
        activity,
        event_date: result.date,
        reference_timezone: referenceTimeZone,
        lunar_phase: result.phaseName,
        illumination: result.illumination,
        recommendation: result.recommendation,
      })
      .select(EVENT_COLUMNS)
      .single();

    setSavingDate(null);
    if (error) {
      setActionError(
        error.code === "23505"
          ? "Ya guardaste esta actividad para ese día."
          : `No se pudo guardar la fecha: ${error.message}`,
      );
      return;
    }

    const savedEvent = toAstralEvent(data);
    if (!savedEvent) {
      setActionError("Supabase devolvió una fecha guardada con datos inválidos.");
      return;
    }

    setSavedEvents((current) =>
      [...current, savedEvent].sort((a, b) =>
        a.eventDate.localeCompare(b.eventDate),
      ),
    );
  }

  async function deleteAstralDate(id: string) {
    if (!me) return;
    setDeletingId(id);
    setActionError("");

    const { data, error } = await supabase
      .from("astral_events")
      .delete()
      .eq("id", id)
      .eq("user_id", me.id)
      .select("id")
      .maybeSingle();

    setDeletingId(null);
    if (error) {
      setActionError(`No se pudo eliminar la fecha: ${error.message}`);
      return;
    }
    if (!data) {
      setActionError("La fecha ya no existe en tu agenda. Actualiza la página.");
      return;
    }

    setSavedEvents((current) => current.filter((event) => event.id !== id));
  }

  if (!ready || (!me && !sessionError)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">
        Verificando tu cuenta...
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-center text-rose-200">
        <p role="alert">{sessionError}</p>
      </div>
    );
  }

  if (!me) return null;

  const calendarOffset =
    monthIsValid
      ? new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
      : 0;
  const dailyReading = currentSky?.reading ?? null;
  const dailyReflection = dailyReading
    ? createDailyReflection(dailyReading)
    : null;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-950 text-white">
      <AppNav active="calendario" />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-amber-300/25 bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950/70 p-6 shadow-2xl shadow-indigo-950/40 sm:p-9">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-24 -z-10 size-72 rounded-full bg-amber-300/10 blur-3xl"
          />
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-slate-950/40 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
                <span aria-hidden="true">✦</span> Calendario astral
              </span>
              <h1 className="font-serif text-3xl leading-tight text-white sm:text-5xl">
                Sigue el ritmo de la Luna
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Explora cada fase, encuentra fechas que conecten con tus
                intenciones y guárdalas en tu agenda personal.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border border-amber-200/20 bg-slate-950/40 px-5 py-4 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Tu espacio
              </p>
              <p className="mt-1 font-serif text-xl text-amber-200">
                {me.name}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {savedEvents.length}{" "}
                {savedEvents.length === 1 ? "fecha guardada" : "fechas guardadas"}
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-950/25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-emerald-100">
            <span className="font-bold">Promoción de inauguración:</span> un
            mes sin costo desde la apertura pública. Después, el Calendario
            astral y Hilo Rojo requerirán VIP. Los planes serán USD 4.99/mes o
            USD 34.99/año. Solo habrá cobros cuando completes una compra
            expresa.
          </p>
          <span className="shrink-0 rounded-full border border-emerald-300/20 px-3 py-1 text-xs font-semibold text-emerald-200">
            Promoción anunciada
          </span>
        </div>

        <section
          aria-labelledby="today-sky-heading"
          className="overflow-hidden rounded-3xl border border-violet-300/25 bg-gradient-to-br from-violet-950/80 via-slate-900 to-indigo-950/70 p-5 shadow-xl sm:p-7"
        >
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-200">
                Lectura del momento
              </p>
              <h2
                id="today-sky-heading"
                className="mt-2 font-serif text-3xl text-white"
              >
                Tu cielo de hoy
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                El cielo actual se compara con tu carta natal guardada. Es una
                lectura astrológica simbólica para reflexionar, no una
                predicción.
              </p>
            </div>
            {dailyReading && (
              <p className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs leading-5 text-slate-300 sm:max-w-xs sm:text-right">
                Calculado{" "}
                {formatCurrentInstant(
                  new Date(dailyReading.calculatedAt),
                  referenceTimeZone,
                )}
                <span className="mt-1 block text-violet-200">
                  Hora local del dispositivo · {referenceTimeZone}
                </span>
              </p>
            )}
          </div>

          {currentSky?.error ? (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-rose-300/20 bg-rose-950/40 p-4 text-sm text-rose-100"
            >
              {currentSky.error}
            </p>
          ) : dailyReading && dailyReflection ? (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <span className="text-4xl" aria-hidden="true">
                    {getMoonSymbol(dailyReading.phaseName)}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Luna ahora
                    </p>
                    <p className="mt-1 font-serif text-xl text-white">
                      {dailyReading.phaseName}
                    </p>
                    <p className="text-sm text-slate-300">
                      En {dailyReading.moonSign} · {dailyReading.illumination}%
                      iluminada
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Movimiento aparente
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    Mercurio{" "}
                    {dailyReading.mercuryRetrograde
                      ? "retrógrado"
                      : "directo"}{" "}
                    · Venus{" "}
                    {dailyReading.venusRetrograde
                      ? "retrógrado"
                      : "directo"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dailyReading.transits.map((transit) => (
                      <span
                        key={transit.id}
                        className="rounded-full border border-violet-200/15 bg-violet-950/45 px-2.5 py-1 text-xs text-violet-100"
                      >
                        {PLANET_META[transit.id].name} en {transit.sign}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-violet-200/15 bg-slate-950/45 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">
                  Contactos más cercanos
                </p>
                {dailyReading.aspects.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {dailyReading.aspects.slice(0, 3).map((aspect, index) => (
                      <li
                        key={`${aspect.transit}-${aspect.natal}-${aspect.aspect}-${index}`}
                        className="rounded-xl border border-violet-200/15 bg-violet-950/45 px-3 py-2 text-xs leading-5 text-slate-200"
                      >
                        {PLANET_META[aspect.transit].name}{" "}
                        {ASPECT_META[aspect.aspect].name} tu{" "}
                        {PLANET_META[aspect.natal].name} natal · orbe{" "}
                        {formatArcMinutes(aspect.orb)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    No aparecen contactos principales dentro del orbe de 3°
                    considerado.
                  </p>
                )}
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-violet-200">
                  Reflexión personalizada
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {dailyReflection.text}
                </p>
                <p className="mt-4 border-l-2 border-amber-300/70 pl-3 text-sm font-medium leading-6 text-amber-100">
                  {dailyReflection.question}
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Se destacan los contactos entre Sol, Luna, Mercurio, Venus y
                  Marte actuales y tus puntos natales con un orbe máximo de 3°.
                  Si la hora de nacimiento es desconocida, se excluyen los
                  contactos con Luna y Ascendente natales.
                </p>
              </div>

              <nav
                aria-label="Continuar explorando el cielo"
                className="mt-5 flex flex-wrap gap-3"
              >
                <a
                  href="#planificador-lunar"
                  className="inline-flex min-h-11 items-center rounded-xl border border-violet-200/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200"
                >
                  Ir al planificador lunar
                </a>

              </nav>
            </>
          ) : (
            <p className="mt-5 text-sm text-slate-300" role="status">
              Preparando la lectura del cielo actual…
            </p>
          )}
        </section>

        <section
          id="planificador-lunar"
          className="grid scroll-mt-24 gap-6 lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                  Fases lunares
                </p>
                <h2 className="mt-1 font-serif text-2xl capitalize text-white">
                  {monthTitle}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Mes anterior"
                  onClick={() => changeMonth(-1)}
                  className="grid size-10 place-items-center rounded-xl border border-slate-700 text-slate-200 transition hover:border-amber-300/60 hover:text-amber-200"
                >
                  ←
                </button>
                <input
                  aria-label="Elegir mes"
                  type="month"
                  value={monthValue}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (isMonthValue(nextValue)) {
                      setMonthValue(nextValue);
                      setSelectedDate(`${nextValue}-01`);
                    }
                  }}
                  className="min-h-10 min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white [color-scheme:dark]"
                />
                <button
                  type="button"
                  aria-label="Mes siguiente"
                  onClick={() => changeMonth(1)}
                  className="grid size-10 place-items-center rounded-xl border border-slate-700 text-slate-200 transition hover:border-amber-300/60 hover:text-amber-200"
                >
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-label={`Calendario lunar de ${monthTitle}`}>
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="py-2 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs"
                >
                  {weekday}
                </div>
              ))}
              {Array.from({ length: calendarOffset }, (_, index) => (
                <div key={`empty-${index}`} aria-hidden="true" />
              ))}
              {calendarDays.map((day: AstralCalendarDay) => {
                const isoDate = `${monthValue}-${String(day.day).padStart(2, "0")}`;
                const isSelected = selectedDate === isoDate;
                return (
                  <button
                    key={isoDate}
                    type="button"
                    aria-label={`${formatAstralDate(isoDate)}: ${day.phaseName}, ${day.illumination}% iluminada`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDate(isoDate)}
                    className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border text-xs transition sm:min-h-[4.5rem] ${
                      isSelected
                        ? "border-amber-300 bg-amber-300/15 text-amber-100 shadow-lg shadow-amber-950/30"
                        : "border-transparent bg-slate-950/60 text-slate-200 hover:border-slate-700 hover:bg-slate-950"
                    }`}
                  >
                    <span className="font-bold">{day.day}</span>
                    <span aria-hidden="true" className="text-base leading-none">
                      {getMoonSymbol(day.phaseName)}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {day.illumination}%
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-800 pt-4 text-[11px] text-slate-400">
              <span>🌑 Nueva</span>
              <span>🌓 Creciente</span>
              <span>🌕 Llena</span>
              <span>🌗 Menguante</span>
              <span className="basis-full text-slate-500">
                Fase, signo lunar y tránsitos calculados para las 12:00 de tu
                zona horaria local ({referenceTimeZone}).
              </span>
            </div>

            {selectedDay && (
              <div className="rounded-2xl border border-indigo-300/15 bg-indigo-950/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
                  Día seleccionado
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">
                    {getMoonSymbol(selectedDay.phaseName)}
                  </span>
                  <div>
                    <p className="font-serif text-lg capitalize text-white">
                      {formatAstralDate(selectedDate)}
                    </p>
                    <p className="text-sm text-slate-300">
                      {selectedDay.phaseName} · {selectedDay.illumination}% de
                      iluminación
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5 rounded-3xl border border-amber-300/15 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-xl sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                Planificador lunar
              </p>
              <h2 className="mt-1 font-serif text-2xl text-white">
                Elige tu intención
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Cada fecha combina fase y signo lunar con el movimiento de
                Mercurio o Venus cuando son relevantes para tu intención. Son
                criterios de la tradición astrológica, no garantías.
              </p>
            </div>

            <label className="block space-y-2 text-sm font-semibold text-slate-200">
              ¿Qué quieres planificar?
              <select
                value={activity}
                onChange={(event) => {
                  const nextActivity = event.target.value;
                  if (isAstralActivity(nextActivity)) setActivity(nextActivity);
                }}
                className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
              >
                {ACTIVITY_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.activities.map((value) => (
                      <option key={value} value={value}>
                        {ACTIVITY_LABELS[value]}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  Fechas sugeridas
                </h3>
                <span className="text-xs text-slate-500">{monthTitle}</span>
              </div>

              {recommendations.length > 0 ? (
                recommendations.map((result) => {
                  const alreadySaved = savedEvents.some(
                    (event) =>
                      event.eventDate === result.date &&
                      event.activity === activity,
                  );
                  return (
                    <article
                      key={result.date}
                      className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-4 transition hover:border-amber-300/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" aria-hidden="true">
                            {getMoonSymbol(result.phaseName)}
                          </span>
                          <div>
                            <p className="font-semibold capitalize text-white">
                              {formatAstralDate(result.date, {
                                weekday: undefined,
                                year: undefined,
                              })}
                            </p>
                            <p className="text-xs text-amber-200">
                              {result.phaseName} · Luna en {result.moonSign} ·{" "}
                              {result.illumination}% iluminada
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={
                            alreadySaved ||
                            savingDate !== null ||
                            eventsLoading ||
                            !eventsAreForCurrentUser
                          }
                          onClick={() => void saveAstralDate(result)}
                          className="shrink-0 rounded-xl bg-amber-300 px-3 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {alreadySaved
                            ? "Guardada"
                            : savingDate === result.date
                              ? "Guardando..."
                              : "Guardar"}
                        </button>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-slate-400">
                        {result.recommendation}
                      </p>
                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Índice astrológico orientativo: {result.score}/100
                      </p>
                    </article>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                  No hay fechas disponibles para este período.
                </p>
              )}
            </div>
          </div>
        </section>



        <section className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                Tu agenda
              </p>
              <h2 className="mt-1 font-serif text-2xl text-white">
                Fechas que guardaste
              </h2>
            </div>
            <p className="max-w-md text-xs leading-5 text-slate-400">
              Se guardan de forma privada en tu cuenta. Las notificaciones
              automáticas de fechas guardadas aún no están disponibles.
            </p>
          </div>

          {calendarError && (
            <p role="alert" className="rounded-xl bg-rose-950/50 p-3 text-sm text-rose-200">
              {calendarError}
            </p>
          )}
          {actionError && (
            <p role="alert" className="rounded-xl bg-rose-950/50 p-3 text-sm text-rose-200">
              {actionError}
            </p>
          )}

          {eventsLoading || !eventsAreForCurrentUser ? (
            <p className="text-sm text-slate-400">Cargando tu agenda...</p>
          ) : savedEvents.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {savedEvents.map((event) => (
                <article
                  key={event.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex gap-3">
                    <span className="mt-0.5 text-2xl" aria-hidden="true">
                      {getMoonSymbol(event.lunarPhase)}
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs font-bold capitalize text-amber-200">
                        {formatAstralDate(event.eventDate)}
                      </p>
                      <h3 className="text-sm font-semibold text-white">
                        {event.title}
                      </h3>
                      <p className="text-xs capitalize text-slate-400">
                        {event.lunarPhase} · {event.illumination}% iluminada
                      </p>
                      <p className="text-xs text-slate-500">
                        Referencia: 12:00 · {event.referenceTimeZone}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={deletingId === event.id}
                    onClick={() => void deleteAstralDate(event.id)}
                    aria-label={`Eliminar ${event.title} del ${event.eventDate}`}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-rose-950/60 hover:text-rose-200 disabled:opacity-50"
                  >
                    {deletingId === event.id ? "..." : "Eliminar"}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
              Tu agenda está lista. Guarda una fecha sugerida y aparecerá aquí.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
