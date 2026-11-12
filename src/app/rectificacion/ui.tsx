"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AppNav } from "@/components/AppNav";
import { useSession } from "@/hooks/useSession";
import {
  EVENT_DATE_PRECISIONS,
  isValidIanaTimeZone,
  RECTIFICATION_EVENT_CATEGORIES,
} from "@/lib/astro/rectification/validation";
import type {
  RectificationEvaluationResult,
  RectificationEvent,
} from "@/lib/astro/rectification/evaluation";
import { supabase } from "@/lib/supabase/client";

interface RectificationCase {
  id: string;
  birth_date: string;
  birth_city: string;
  birth_country: string;
  birth_latitude: number;
  birth_longitude: number;
  birth_timezone: string;
  interval_start_date: string;
  interval_start_time: string;
  interval_end_date: string;
  interval_end_time: string;
  candidate_step_minutes: number;
}

interface RectificationEventRow extends RectificationEvent {
  description: string | null;
  id: string;
}

interface RunHistoryItem {
  id: string;
  methodology_version: string;
  status: RectificationEvaluationResult["status"];
  candidate_count: number;
  event_count: number;
  score_gap: number | null;
  created_at: string;
}

interface RectificationRun extends RunHistoryItem {
  results: RectificationEvaluationResult;
}

interface EventFormState {
  category: RectificationEvent["category"];
  dateStart: string;
  dateEnd: string;
  datePrecision: RectificationEvent["datePrecision"];
  eventTimeZone: string;
  description: string;
  relevance: number;
}

interface RectificationFormState {
  birthDate: string;
  birthCity: string;
  birthCountry: string;
  latitude: string;
  longitude: string;
  timeZone: string;
  intervalStartDate: string;
  intervalStartTime: string;
  intervalEndDate: string;
  intervalEndTime: string;
  stepMinutes: string;
}

const CATEGORY_LABELS: Record<RectificationEvent["category"], string> = {
  marriage: "Matrimonio",
  separation: "Separación",
  child_birth: "Nacimiento de un hijo",
  move: "Mudanza",
  emigration: "Emigración",
  career_change: "Cambio profesional",
  promotion: "Ascenso",
  business: "Creación de negocio",
  personal_crisis: "Crisis personal",
  family_death: "Fallecimiento familiar",
  accident: "Accidente",
  surgery: "Operación importante",
  other: "Otro acontecimiento",
};

const PRECISION_LABELS: Record<RectificationEvent["datePrecision"], string> = {
  exact: "Exacta",
  approximate: "Aproximada",
  month: "Mes conocido",
  year: "Año conocido",
  interval: "Intervalo",
};

const STATUS_LABELS: Record<RectificationEvaluationResult["status"], string> = {
  insufficient_evidence: "Coincidencias limitadas",
  ambiguous: "Resultado ambiguo",
  relative_ranking: "Orden comparativo",
};
const VALID_STATUSES = new Set<string>(Object.keys(STATUS_LABELS));
const EVENT_CATEGORY_SET = new Set<string>(RECTIFICATION_EVENT_CATEGORIES);
const EVENT_PRECISION_SET = new Set<string>(EVENT_DATE_PRECISIONS);
const POINT_LABELS: Record<string, string> = {
  sun: "Sol",
  moon: "Luna",
  mercury: "Mercurio",
  venus: "Venus",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
  asc: "Ascendente",
  dsc: "Descendente",
  mc: "Medio Cielo",
  ic: "Fondo del Cielo",
};
const TECHNIQUE_LABELS: Record<string, string> = {
  transits: "Tránsitos",
  secondaryProgressions: "Progresiones secundarias",
  solarArc: "Arco solar",
};
const TIME_ZONE_SUGGESTIONS = [
  "America/Caracas",
  "America/Bogota",
  "America/Lima",
  "America/Guayaquil",
  "America/La_Paz",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Montevideo",
  "America/Mexico_City",
  "America/Panama",
  "America/Santo_Domingo",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Madrid",
  "Europe/London",
  "Europe/Paris",
  "UTC",
];
const ASPECT_LABELS: Record<number, string> = {
  0: "conjunción",
  60: "sextil",
  90: "cuadratura",
  120: "trígono",
  180: "oposición",
};

function isEventCategory(value: unknown): value is RectificationEvent["category"] {
  return typeof value === "string" && EVENT_CATEGORY_SET.has(value);
}

function isEventPrecision(
  value: unknown,
): value is RectificationEvent["datePrecision"] {
  return typeof value === "string" && EVENT_PRECISION_SET.has(value);
}

const INPUT_CLASS =
  "mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-base text-white outline-none transition placeholder:text-slate-500 focus-visible:border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-300/40";
const LABEL_CLASS = "block text-sm font-medium text-slate-200";
const BUTTON_CLASS =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-300/40 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-200/70 hover:bg-rose-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200 disabled:cursor-wait disabled:opacity-55";
const SECONDARY_BUTTON_CLASS =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-55";

const EMPTY_EVENT: EventFormState = {
  category: "marriage",
  dateStart: "",
  dateEnd: "",
  datePrecision: "exact",
  eventTimeZone: "",
  description: "",
  relevance: 3,
};

const EMPTY_RECTIFICATION: RectificationFormState = {
  birthDate: "",
  birthCity: "",
  birthCountry: "",
  latitude: "",
  longitude: "",
  timeZone: "",
  intervalStartDate: "",
  intervalStartTime: "",
  intervalEndDate: "",
  intervalEndTime: "",
  stepMinutes: "5",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Tu sesión terminó. Inicia sesión para continuar.");

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body) headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    headers,
  });
  if (response.status === 204) return null;

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      isRecord(body) && typeof body.error === "string"
        ? body.error
        : "No se pudo completar la operación.",
    );
  }
  return body;
}

function isRectificationCase(value: unknown): value is RectificationCase {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.birth_date === "string" &&
    typeof value.birth_city === "string" &&
    typeof value.birth_country === "string" &&
    typeof value.birth_latitude === "number" &&
    typeof value.birth_longitude === "number" &&
    typeof value.birth_timezone === "string" &&
    typeof value.interval_start_date === "string" &&
    typeof value.interval_start_time === "string" &&
    typeof value.interval_end_date === "string" &&
    typeof value.interval_end_time === "string" &&
    typeof value.candidate_step_minutes === "number"
  );
}

function isEventRow(value: unknown): value is RectificationEventRow {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isEventCategory(value.category) &&
    typeof value.date_start === "string" &&
    typeof value.date_end === "string" &&
    isEventPrecision(value.date_precision) &&
    (typeof value.event_timezone === "string" || value.event_timezone === null) &&
    (typeof value.description === "string" || value.description === null) &&
    typeof value.relevance === "number" &&
    Number.isInteger(value.relevance)
  );
}

function isRunHistoryItem(value: unknown): value is RunHistoryItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.methodology_version === "string" &&
    typeof value.status === "string" &&
    VALID_STATUSES.has(value.status) &&
    typeof value.candidate_count === "number" &&
    typeof value.event_count === "number" &&
    (typeof value.score_gap === "number" || value.score_gap === null) &&
    typeof value.created_at === "string"
  );
}

function isEvaluationResult(value: unknown): value is RectificationEvaluationResult {
  return (
    isRecord(value) &&
    typeof value.methodologyVersion === "string" &&
    typeof value.status === "string" &&
    VALID_STATUSES.has(value.status) &&
    Array.isArray(value.candidates) &&
    value.candidates.every(
      (candidate) =>
        isRecord(candidate) &&
        typeof candidate.utc === "string" &&
        typeof candidate.localDate === "string" &&
        typeof candidate.localTime === "string" &&
        typeof candidate.score === "number" &&
        Array.isArray(candidate.eventEvidence),
    )
  );
}

function isRectificationRun(value: unknown): value is RectificationRun {
  return (
    isRunHistoryItem(value) &&
    isRecord(value) &&
    isEvaluationResult(value.results)
  );
}

function scoreLabel(score: number): string {
  return `${Math.round(score * 100)} / 100`;
}

function formatRunDate(value: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ErrorMessage({ children }: { children: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-rose-300/35 bg-rose-950/50 px-4 py-3 text-sm leading-6 text-rose-100"
    >
      {children}
    </p>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  step,
  min,
  max,
  hint,
  error,
  list,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  step?: string;
  min?: number;
  max?: number;
  hint?: string;
  error?: string;
  list?: string;
  placeholder?: string;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <label className={LABEL_CLASS} htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={step}
        min={min}
        max={max}
        list={list}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={INPUT_CLASS}
      />
      {list && (
        <datalist id={list}>
          {TIME_ZONE_SUGGESTIONS.map((timeZone) => (
            <option key={timeZone} value={timeZone} />
          ))}
        </datalist>
      )}
      {hint && (
        <span id={hintId} className="mt-1 block text-xs font-normal leading-5 text-slate-400">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="mt-1 block text-sm leading-5 text-rose-200">
          {error}
        </span>
      )}
    </label>
  );
}

export function RectificationUi() {
  const router = useRouter();
  const { ready, me, error: sessionError } = useSession();
  const errorHeadingRef = useRef<HTMLDivElement>(null);
  const [cases, setCases] = useState<RectificationCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<RectificationCase | null>(null);
  const [events, setEvents] = useState<RectificationEventRow[]>([]);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [activeRun, setActiveRun] = useState<RectificationRun | null>(null);
  const [rectificationForm, setRectificationForm] =
    useState<RectificationFormState>(EMPTY_RECTIFICATION);
  const [eventForm, setEventForm] = useState<EventFormState>(EMPTY_EVENT);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [techniqueWeights, setTechniqueWeights] = useState({
    transits: 1,
    secondaryProgressions: 1,
    solarArc: 1,
  });
  const [pageError, setPageError] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [timeZoneError, setTimeZoneError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingCase, setSavingCase] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [running, setRunning] = useState(false);
  const caseLoadVersion = useRef(0);
  const currentCaseId = useRef<string | null>(null);

  const loadCases = useCallback(async () => {
    const payload = await requestJson("/api/rectifications");
    if (!isRecord(payload) || !Array.isArray(payload.rectifications)) {
      throw new Error("La respuesta de expedientes no es válida.");
    }
    const nextCases = payload.rectifications.filter(isRectificationCase);
    if (nextCases.length !== payload.rectifications.length) {
      throw new Error("Un expediente guardado tiene un formato no válido.");
    }
    setCases(nextCases);
    if (selectedCase && !nextCases.some((item) => item.id === selectedCase.id)) {
      caseLoadVersion.current += 1;
      currentCaseId.current = null;
      setSelectedCase(null);
      setEvents([]);
      setHistory([]);
      setActiveRun(null);
    }
  }, [selectedCase]);

  const loadCase = useCallback(async (rectification: RectificationCase) => {
    const requestVersion = ++caseLoadVersion.current;
    currentCaseId.current = rectification.id;
    setLoading(true);
    setPageError("");
    setPageNotice("");
    setSelectedCase(rectification);
    setEvents([]);
    setHistory([]);
    setActiveRun(null);
    setEditingEventId(null);
    setEventForm(EMPTY_EVENT);
    try {
      const [eventPayload, runPayload] = await Promise.all([
        requestJson(`/api/rectifications/${rectification.id}/events`),
        requestJson(`/api/rectifications/${rectification.id}/runs`),
      ]);
      if (requestVersion !== caseLoadVersion.current) return;
      if (
        !isRecord(eventPayload) ||
        !Array.isArray(eventPayload.events) ||
        !isRecord(runPayload) ||
        !Array.isArray(runPayload.history)
      ) {
        throw new Error("La respuesta del expediente no es válida.");
      }

      const nextEvents = eventPayload.events.filter(isEventRow);
      const nextHistory = runPayload.history.filter(isRunHistoryItem);
      if (
        nextEvents.length !== eventPayload.events.length ||
        nextHistory.length !== runPayload.history.length
      ) {
        throw new Error("El historial del expediente contiene datos no válidos.");
      }
      let nextRun: RectificationRun | null = null;
      if (runPayload.latestRun !== null && runPayload.latestRun !== undefined) {
        if (!isRectificationRun(runPayload.latestRun)) {
          throw new Error("El resultado guardado no es válido.");
        }
        nextRun = runPayload.latestRun;
      }
      setEvents(nextEvents);
      setHistory(nextHistory);
      setActiveRun(nextRun);
    } catch (cause) {
      if (requestVersion !== caseLoadVersion.current) return;
      setPageError(
        cause instanceof Error
          ? cause.message
          : "No se pudo cargar el expediente.",
      );
    } finally {
      if (requestVersion === caseLoadVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || sessionError || me) return;
    router.replace("/acceso?mode=login");
  }, [me, ready, router, sessionError]);

  useEffect(() => {
    if (!ready || !me) return;
    let active = true;
    void requestJson("/api/rectifications")
      .then((payload) => {
        if (!active) return;
        if (!isRecord(payload) || !Array.isArray(payload.rectifications)) {
          throw new Error("La respuesta de expedientes no es válida.");
        }
        const nextCases = payload.rectifications.filter(isRectificationCase);
        if (nextCases.length !== payload.rectifications.length) {
          throw new Error("Un expediente guardado tiene un formato no válido.");
        }
        setCases(nextCases);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setPageError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar tus expedientes.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [me, ready]);

  useEffect(() => {
    if (!pageError) return;
    errorHeadingRef.current?.focus();
  }, [pageError]);

  async function handleCreateCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError("");
    setPageNotice("");
    const timeZone = rectificationForm.timeZone.trim();
    if (!isValidIanaTimeZone(timeZone)) {
      setTimeZoneError(
        "Elige una zona IANA, por ejemplo America/Caracas. No uses abreviaturas como VET ni offsets como UTC-4.",
      );
      document.getElementById("timeZone")?.focus();
      return;
    }
    setTimeZoneError("");
    setSavingCase(true);
    const body = {
      birthDate: rectificationForm.birthDate,
      birthCity: rectificationForm.birthCity,
      birthCountry: rectificationForm.birthCountry,
      latitude: Number(rectificationForm.latitude),
      longitude: Number(rectificationForm.longitude),
      timeZone,
      intervalStart: {
        date: rectificationForm.intervalStartDate,
        time: rectificationForm.intervalStartTime,
      },
      intervalEnd: {
        date: rectificationForm.intervalEndDate,
        time: rectificationForm.intervalEndTime,
      },
      stepMinutes: Number(rectificationForm.stepMinutes),
    };
    try {
      const payload = await requestJson("/api/rectifications", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!isRecord(payload) || !isRecord(payload.rectification)) {
        throw new Error("No se pudo confirmar la creación del expediente.");
      }
      const rectification = payload.rectification;
      if (!isRectificationCase(rectification)) {
        throw new Error("El expediente creado no tiene un formato válido.");
      }
      setRectificationForm(EMPTY_RECTIFICATION);
      await loadCases();
      await loadCase(rectification);
      setPageNotice("Expediente creado. Añade acontecimientos para evaluar.");
    } catch (cause) {
      setPageError(
        cause instanceof Error
          ? cause.message
          : "No se pudo crear el expediente.",
      );
    } finally {
      setSavingCase(false);
    }
  }

  async function handleDeleteCase(rectification: RectificationCase) {
    if (
      !window.confirm(
        "Se eliminarán el expediente, sus acontecimientos y todos sus resultados guardados. Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }
    setPageError("");
    setPageNotice("");
    try {
      await requestJson(`/api/rectifications/${rectification.id}`, {
        method: "DELETE",
      });
      await loadCases();
      setPageNotice("Expediente y datos asociados eliminados.");
    } catch (cause) {
      setPageError(
        cause instanceof Error
          ? cause.message
          : "No se pudo eliminar el expediente.",
      );
    }
  }

  async function handleSubmitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCase) return;
    setPageError("");
    setPageNotice("");
    setSavingEvent(true);
    const body = {
      category: eventForm.category,
      dateStart: eventForm.dateStart,
      dateEnd: eventForm.dateEnd,
      datePrecision: eventForm.datePrecision,
      eventTimeZone: eventForm.eventTimeZone.trim() || null,
      description: eventForm.description.trim() || null,
      relevance: Number(eventForm.relevance),
    };
    try {
      const path = `/api/rectifications/${selectedCase.id}/events${
        editingEventId ? `/${editingEventId}` : ""
      }`;
      await requestJson(path, {
        method: editingEventId ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      await loadCase(selectedCase);
      setEventForm(EMPTY_EVENT);
      setEditingEventId(null);
      setPageNotice(
        editingEventId ? "Acontecimiento actualizado." : "Acontecimiento guardado.",
      );
    } catch (cause) {
      setPageError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar el acontecimiento.",
      );
    } finally {
      setSavingEvent(false);
    }
  }

  function editEvent(event: RectificationEventRow) {
    setEditingEventId(event.id);
    setEventForm({
      category: event.category,
      dateStart: event.dateStart,
      dateEnd: event.dateEnd,
      datePrecision: event.datePrecision,
      eventTimeZone: event.eventTimeZone ?? "",
      description: event.description ?? "",
      relevance: event.relevance,
    });
  }

  async function deleteEvent(event: RectificationEventRow) {
    if (!selectedCase || !window.confirm("¿Eliminar este acontecimiento?")) return;
    setPageError("");
    setPageNotice("");
    try {
      await requestJson(
        `/api/rectifications/${selectedCase.id}/events/${event.id}`,
        { method: "DELETE" },
      );
      await loadCase(selectedCase);
      setPageNotice("Acontecimiento eliminado.");
    } catch (cause) {
      setPageError(
        cause instanceof Error
          ? cause.message
          : "No se pudo eliminar el acontecimiento.",
      );
    }
  }

  async function runEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCase || events.length === 0) return;
    setPageError("");
    setPageNotice("");
    setRunning(true);
    try {
      const payload = await requestJson(
        `/api/rectifications/${selectedCase.id}/runs`,
        {
          method: "POST",
          body: JSON.stringify({ techniqueWeights }),
        },
      );
      if (!isRecord(payload) || !isRectificationRun(payload.run)) {
        throw new Error("El resultado del cálculo no tiene un formato válido.");
      }
      const run = payload.run;
      setActiveRun(run);
      setHistory((previous) =>
        [run, ...previous.filter((item) => item.id !== run.id)].slice(0, 10),
      );
      setPageNotice("Evaluación completada y guardada en este expediente.");
    } catch (cause) {
      setPageError(
        cause instanceof Error
          ? cause.message
          : "No se pudo completar la evaluación.",
      );
    } finally {
      setRunning(false);
    }
  }

  async function selectRun(runId: string) {
    if (!selectedCase) return;
    const targetCaseId = selectedCase.id;
    setPageError("");
    setLoading(true);
    try {
      const payload = await requestJson(
        `/api/rectifications/${selectedCase.id}/runs/${runId}`,
      );
      if (!isRecord(payload) || !isRectificationRun(payload.run)) {
        throw new Error("El resultado guardado no es válido.");
      }
      if (currentCaseId.current !== targetCaseId) return;
      setActiveRun(payload.run);
    } catch (cause) {
      if (currentCaseId.current !== targetCaseId) return;
      setPageError(
        cause instanceof Error
          ? cause.message
          : "No se pudo abrir el resultado.",
      );
    } finally {
      if (currentCaseId.current === targetCaseId) setLoading(false);
    }
  }

  async function deleteRun(runId: string) {
    if (!selectedCase || !window.confirm("¿Eliminar este resultado guardado?")) return;
    setPageError("");
    try {
      await requestJson(
        `/api/rectifications/${selectedCase.id}/runs/${runId}`,
        { method: "DELETE" },
      );
      setHistory((previous) => previous.filter((item) => item.id !== runId));
      if (activeRun?.id === runId) setActiveRun(null);
      setPageNotice("Resultado guardado eliminado.");
    } catch (cause) {
      setPageError(
        cause instanceof Error
          ? cause.message
          : "No se pudo eliminar el resultado.",
      );
    }
  }

  if (!ready || (!me && !sessionError)) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-200">
        <p role="status">Comprobando tu sesión...</p>
      </main>
    );
  }
  if (sessionError) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4">
        <ErrorMessage>{sessionError}</ErrorMessage>
      </main>
    );
  }
  if (!me) return null;

  return (
    <div className="starfield min-h-screen overflow-x-clip text-white">
      <AppNav active="rectificacion" />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#211333]/95 via-[#100d1d]/95 to-[#160c19]/95 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.28)] sm:mb-10 sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-600/15 blur-3xl"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">
            Herramienta privada · comparación de cartas natales
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
            Rectificación de hora natal
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            Calcula cartas para las horas de tu intervalo y compáralas con
            acontecimientos importantes. Explora cuáles muestran mayor
            correspondencia según tránsitos, progresiones secundarias y arco
            solar.
          </p>
        </header>

        {pageError && (
          <div
            ref={errorHeadingRef}
            tabIndex={-1}
            aria-label="Error"
            className="mb-5 outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
          >
            <ErrorMessage>{pageError}</ErrorMessage>
          </div>
        )}
        {pageNotice && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-emerald-300/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100"
          >
            {pageNotice}
          </p>
        )}
        {loading && (
          <p role="status" className="mb-5 text-sm text-slate-300">
            Cargando información del expediente...
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section
            aria-labelledby="cases-title"
            className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl sm:p-7"
          >
            <h2 id="cases-title" className="font-serif text-2xl font-semibold">
              Tus expedientes
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Los datos y acontecimientos de cada expediente son privados.
            </p>
            <div className="mt-5 space-y-3">
              {cases.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm leading-6 text-slate-400">
                  Aún no tienes expedientes. Crea uno para empezar.
                </p>
              ) : (
                cases.map((item) => (
                  <article
                    key={item.id}
                    className={
                      "rounded-2xl border p-4 transition " +
                      (selectedCase?.id === item.id
                        ? "border-rose-200/50 bg-rose-950/25"
                        : "border-white/10 bg-white/[0.025]")
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!running) void loadCase(item);
                      }}
                      disabled={running}
                      aria-pressed={selectedCase?.id === item.id}
                      className="min-h-11 w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <span className="block font-semibold text-white">
                        {item.birth_city}, {item.birth_country}
                      </span>
                      <span className="mt-1 block text-sm text-slate-400">
                        Nacimiento: {item.birth_date} · {item.birth_timezone}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {item.interval_start_date} {item.interval_start_time.slice(0, 5)}
                        {" – "}
                        {item.interval_end_date} {item.interval_end_time.slice(0, 5)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCase(item)}
                      disabled={running}
                      className="mt-3 min-h-10 cursor-pointer rounded-lg px-2 text-xs font-medium text-rose-200 underline decoration-rose-300/40 underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Eliminar expediente y resultados
                    </button>
                  </article>
                ))
              )}
            </div>

            <details className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025]">
              <summary className="min-h-12 cursor-pointer px-4 py-3 text-sm font-semibold text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Crear expediente
              </summary>
              <form
                onSubmit={(event) => void handleCreateCase(event)}
                className="grid gap-4 border-t border-white/10 p-4 sm:grid-cols-2"
              >
                <Field
                  label="Fecha de nacimiento"
                  name="birthDate"
                  type="date"
                  value={rectificationForm.birthDate}
                  onChange={(value) =>
                    setRectificationForm((current) => ({
                      ...current,
                      birthDate: value,
                    }))
                  }
                  required
                />
                <Field
                  label="Ciudad de nacimiento"
                  name="birthCity"
                  value={rectificationForm.birthCity}
                  onChange={(value) =>
                    setRectificationForm((current) => ({
                      ...current,
                      birthCity: value,
                    }))
                  }
                  required
                />
                <Field
                  label="País"
                  name="birthCountry"
                  value={rectificationForm.birthCountry}
                  onChange={(value) =>
                    setRectificationForm((current) => ({
                      ...current,
                      birthCountry: value,
                    }))
                  }
                  required
                />
                <Field
                  label="Latitud"
                  name="latitude"
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={rectificationForm.latitude}
                  onChange={(value) =>
                    setRectificationForm((current) => ({
                      ...current,
                      latitude: value,
                    }))
                  }
                  required
                  hint="De -90 a 90 grados decimales."
                />
                <Field
                  label="Longitud"
                  name="longitude"
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={rectificationForm.longitude}
                  onChange={(value) =>
                    setRectificationForm((current) => ({
                      ...current,
                      longitude: value,
                    }))
                  }
                  required
                  hint="De -180 a 180 grados decimales."
                />
                <Field
                  label="Zona horaria natal (IANA)"
                  name="timeZone"
                  value={rectificationForm.timeZone}
                  onChange={(value) =>
                    {
                      setTimeZoneError("");
                      setRectificationForm((current) => ({
                        ...current,
                        timeZone: value,
                      }));
                    }
                  }
                  required
                  list="birth-time-zones"
                  placeholder="America/Caracas"
                  hint="Escribe o elige una zona IANA. Las sugerencias no sustituyen la zona histórica de nacimiento."
                  error={timeZoneError}
                />
                <Field
                  label="Inicio del intervalo · fecha"
                  name="intervalStartDate"
                  type="date"
                  value={rectificationForm.intervalStartDate}
                  onChange={(value) =>
                    setRectificationForm((current) => ({
                      ...current,
                      intervalStartDate: value,
                    }))
                  }
                  required
                />
                <Field
                  label="Inicio del intervalo · hora local"
                  name="intervalStartTime"
                  type="time"
                  value={rectificationForm.intervalStartTime}
                  onChange={(value) =>
                    setRectificationForm((current) => ({
                      ...current,
                      intervalStartTime: value,
                    }))
                  }
                  required
                />
                <Field
                  label="Final del intervalo · fecha"
                  name="intervalEndDate"
                  type="date"
                  value={rectificationForm.intervalEndDate}
                  onChange={(value) =>
                    setRectificationForm((current) => ({
                      ...current,
                      intervalEndDate: value,
                    }))
                  }
                  required
                />
                <Field
                  label="Final del intervalo · hora local"
                  name="intervalEndTime"
                  type="time"
                  value={rectificationForm.intervalEndTime}
                  onChange={(value) =>
                    setRectificationForm((current) => ({
                      ...current,
                      intervalEndTime: value,
                    }))
                  }
                  required
                />
                <Field
                  label="Paso entre candidatos · minutos"
                  name="stepMinutes"
                  type="number"
                  min={1}
                  max={1440}
                  value={rectificationForm.stepMinutes}
                  onChange={(value) =>
                    setRectificationForm((current) => ({
                      ...current,
                      stepMinutes: value,
                    }))
                  }
                  required
                  hint="El intervalo debe producir como máximo 300 candidatos."
                />
                <button
                  type="submit"
                  disabled={savingCase}
                  aria-busy={savingCase}
                  className={`${BUTTON_CLASS} sm:col-span-2`}
                >
                  {savingCase ? "Guardando..." : "Guardar expediente"}
                </button>
              </form>
            </details>
          </section>

          <div className="space-y-6">
            <section
              aria-labelledby="events-title"
              className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl sm:p-7"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="events-title" className="font-serif text-2xl font-semibold">
                    Acontecimientos
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {selectedCase
                      ? `${events.length} de 50 registrados.`
                      : "Selecciona un expediente para administrarlos."}
                  </p>
                </div>
              </div>

              {selectedCase && (
                <>
                  <div className="mt-5 space-y-3">
                    {events.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm leading-6 text-slate-400">
                        Registra al menos un acontecimiento fechado antes de
                        ejecutar la evaluación.
                      </p>
                    ) : (
                      events.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-slate-100">
                                {CATEGORY_LABELS[item.category]}
                              </h3>
                              <p className="mt-1 text-sm text-slate-300">
                                {item.dateStart === item.dateEnd
                                  ? item.dateStart
                                  : `${item.dateStart} – ${item.dateEnd}`}
                                {" · "}
                                {PRECISION_LABELS[item.datePrecision]}
                                {" · Relevancia "}
                                {item.relevance}/5
                              </p>
                              {item.description && (
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => editEvent(item)}
                                className={SECONDARY_BUTTON_CLASS}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteEvent(item)}
                                className="min-h-11 cursor-pointer rounded-xl px-3 text-sm font-medium text-rose-200 underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  <form
                    onSubmit={(event) => void handleSubmitEvent(event)}
                    className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2"
                  >
                    <label className={LABEL_CLASS} htmlFor="eventCategory">
                      Categoría
                      <select
                        id="eventCategory"
                        value={eventForm.category}
                        onChange={(event) =>
                          setEventForm((current) => ({
                            ...current,
                            category: event.target.value as RectificationEvent["category"],
                          }))
                        }
                        className={INPUT_CLASS}
                      >
                        {RECTIFICATION_EVENT_CATEGORIES.map((category) => (
                          <option key={category} value={category} className="bg-slate-900">
                            {CATEGORY_LABELS[category]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={LABEL_CLASS} htmlFor="eventDatePrecision">
                      Precisión de fecha
                      <select
                        id="eventDatePrecision"
                        value={eventForm.datePrecision}
                        onChange={(event) =>
                          setEventForm((current) => ({
                            ...current,
                            datePrecision: event.target.value as RectificationEvent["datePrecision"],
                            ...(event.target.value === "exact"
                              ? { dateEnd: current.dateStart }
                              : {}),
                          }))
                        }
                        className={INPUT_CLASS}
                      >
                        {EVENT_DATE_PRECISIONS.map((precision) => (
                          <option key={precision} value={precision} className="bg-slate-900">
                            {PRECISION_LABELS[precision]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="text-xs leading-5 text-slate-400 sm:col-span-2">
                      Si conoces solo el mes o el año, indica en el intervalo la
                      primera y la última fecha de ese período.
                    </p>
                    <Field
                      label="Fecha desde"
                      name="eventDateStart"
                      type="date"
                      value={eventForm.dateStart}
                      onChange={(value) =>
                        setEventForm((current) => ({
                          ...current,
                          dateStart: value,
                          ...(current.datePrecision === "exact"
                            ? { dateEnd: value }
                            : {}),
                        }))
                      }
                      required
                    />
                    <Field
                      label="Fecha hasta"
                      name="eventDateEnd"
                      type="date"
                      value={eventForm.dateEnd}
                      onChange={(value) =>
                        setEventForm((current) => ({
                          ...current,
                          dateEnd: current.datePrecision === "exact" ? current.dateStart : value,
                        }))
                      }
                      required
                    />
                    <Field
                      label="Zona horaria del acontecimiento (opcional)"
                      name="eventTimeZone"
                      value={eventForm.eventTimeZone}
                      onChange={(value) =>
                        setEventForm((current) => ({
                          ...current,
                          eventTimeZone: value,
                        }))
                      }
                      hint="Si la dejas vacía se usa la zona natal, no la del dispositivo."
                    />
                    <label className={LABEL_CLASS} htmlFor="eventRelevance">
                      Relevancia: {eventForm.relevance} de 5
                      <input
                        id="eventRelevance"
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={eventForm.relevance}
                        onChange={(event) =>
                          setEventForm((current) => ({
                            ...current,
                            relevance: Number(event.target.value),
                          }))
                        }
                        className="mt-3 min-h-11 w-full accent-rose-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200"
                      />
                    </label>
                    <label
                      className={`${LABEL_CLASS} sm:col-span-2`}
                      htmlFor="eventDescription"
                    >
                      Nota privada (opcional)
                      <textarea
                        id="eventDescription"
                        value={eventForm.description}
                        onChange={(event) =>
                          setEventForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        maxLength={2000}
                        rows={3}
                        className={INPUT_CLASS}
                      />
                    </label>
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                      <button
                        type="submit"
                        disabled={savingEvent || (events.length >= 50 && !editingEventId)}
                        aria-busy={savingEvent}
                        className={BUTTON_CLASS}
                      >
                        {savingEvent
                          ? "Guardando..."
                          : editingEventId
                            ? "Actualizar acontecimiento"
                            : "Guardar acontecimiento"}
                      </button>
                      {editingEventId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEventId(null);
                            setEventForm(EMPTY_EVENT);
                          }}
                          className={SECONDARY_BUTTON_CLASS}
                        >
                          Cancelar edición
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </section>

            <section
              aria-labelledby="evaluation-title"
              className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl sm:p-7"
            >
              <h2 id="evaluation-title" className="font-serif text-2xl font-semibold">
                Evaluación comparativa
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Ajusta los pesos relativos. Un peso de cero excluye esa técnica.
              </p>
              <form onSubmit={(event) => void runEvaluation(event)} className="mt-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      ["transits", "Tránsitos"],
                      ["secondaryProgressions", "Progresiones secundarias"],
                      ["solarArc", "Arco solar"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className={LABEL_CLASS} htmlFor={`weight-${key}`}>
                      {label}
                      <input
                        id={`weight-${key}`}
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={techniqueWeights[key]}
                        onChange={(event) =>
                          setTechniqueWeights((current) => ({
                            ...current,
                            [key]: Number(event.target.value),
                          }))
                        }
                        className={INPUT_CLASS}
                      />
                    </label>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={!selectedCase || events.length === 0 || running}
                  aria-busy={running}
                  className={`${BUTTON_CLASS} mt-5 w-full sm:w-auto`}
                >
                  {running ? "Calculando y guardando..." : "Evaluar horas candidatas"}
                </button>
                {running && (
                  <p role="status" className="mt-3 text-sm text-slate-300">
                    Comparando cartas y acontecimientos en el servidor. No cierres
                    esta pantalla hasta que termine.
                  </p>
                )}
              </form>

              {history.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <h3 className="text-sm font-semibold text-slate-200">
                    Resultados guardados
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {history.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => void selectRun(item.id)}
                          className="min-h-11 cursor-pointer text-left text-sm text-slate-200 underline decoration-white/20 underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          {formatRunDate(item.created_at)} · {STATUS_LABELS[item.status]}
                          <span className="block text-xs text-slate-400">
                            {item.candidate_count} candidatos · {item.event_count} acontecimientos
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteRun(item.id)}
                          aria-label={`Eliminar resultado del ${formatRunDate(item.created_at)}`}
                          className="min-h-11 min-w-11 cursor-pointer rounded-lg px-2 text-xs text-rose-200 underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          Eliminar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeRun && (
                <EvaluationResults run={activeRun} />
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function EvaluationResults({ run }: { run: RectificationRun }) {
  const candidates = run.results.candidates;
  const topFive = candidates.slice(0, 5);
  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">
            {run.methodology_version}
          </p>
          <h3 className="mt-2 font-serif text-xl font-semibold">
            {STATUS_LABELS[run.status]}
          </h3>
        </div>
        <p className="text-sm text-slate-300">
          {run.candidate_count} candidatas · {run.event_count} acontecimientos
        </p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {run.score_gap === null
          ? "Se evaluó una hora candidata; puedes ampliar el intervalo para comparar más opciones."
          : `Diferencia entre las dos candidatas con mayor correspondencia: ${scoreLabel(run.score_gap)}.`}
        {" "}Explora los contactos y las técnicas de cada resultado para conocer
        cómo se construyó la comparación.
      </p>
      <ol className="mt-4 space-y-3">
        {topFive.map((candidate, index) => (
          <li
            key={candidate.utc}
            className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-white">
                  {index + 1}. {candidate.localDate} · {candidate.localTime}
                  {candidate.occurrence !== "unique" && (
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      ({candidate.occurrence === "earlier" ? "primera" : "segunda"} ocurrencia)
                    </span>
                  )}
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Instante UTC: {candidate.utc}
                </p>
              </div>
              <span className="rounded-full border border-rose-200/30 px-3 py-1 text-sm font-semibold text-rose-100">
                {scoreLabel(candidate.score)}
              </span>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700"
              role="meter"
              aria-label={`Puntaje comparativo ${index + 1}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(candidate.score * 100)}
            >
              <div
                className="h-full rounded-full bg-rose-300"
                style={{ width: `${Math.max(0, Math.min(100, candidate.score * 100))}%` }}
              />
            </div>
            {candidate.sensitivity.minScoreWithoutOneEvent !== null &&
              candidate.sensitivity.maxScoreWithoutOneEvent !== null && (
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Rango al retirar un acontecimiento:{" "}
                  {scoreLabel(candidate.sensitivity.minScoreWithoutOneEvent)}
                  {" – "}
                  {scoreLabel(candidate.sensitivity.maxScoreWithoutOneEvent)}.
                </p>
              )}
            {index === 0 && (
              <div className="mt-4 space-y-3">
                {candidate.eventEvidence.map((evidence) => (
                  <details
                    key={evidence.eventId}
                    className="rounded-xl border border-white/10 px-3 py-2"
                  >
                    <summary className="min-h-10 cursor-pointer py-2 text-sm text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                      {CATEGORY_LABELS[evidence.category]} · {scoreLabel(evidence.combinedScore)}
                      {" · Relevancia "}
                      {evidence.relevance}/5
                    </summary>
                    <div className="space-y-2 pb-2 text-xs leading-5 text-slate-400">
                      <p>
                        Muestras: {evidence.sampleCount} · Zona: {evidence.timezoneUsed}
                        {evidence.timezoneSource === "birth" ? " (natal)" : " (acontecimiento)"}
                      </p>
                      <p>
                        {TECHNIQUE_LABELS.transits}: {scoreLabel(evidence.techniqueScores.transits)} ·
                        {" "}{TECHNIQUE_LABELS.secondaryProgressions}: {scoreLabel(evidence.techniqueScores.secondaryProgressions)}
                        {" "}· {TECHNIQUE_LABELS.solarArc}: {scoreLabel(evidence.techniqueScores.solarArc)}
                      </p>
                      {evidence.peakContacts.length > 0 ? (
                        <ul className="space-y-1">
                          {evidence.peakContacts.slice(0, 8).map((contact, contactIndex) => (
                            <li key={`${contact.technique}-${contact.target}-${contactIndex}`}>
                              {TECHNIQUE_LABELS[contact.technique]}:{" "}
                              {POINT_LABELS[contact.factor] ?? contact.factor} con{" "}
                              {POINT_LABELS[contact.target] ?? contact.target},
                              {" "}{ASPECT_LABELS[contact.aspectDegrees] ?? `${contact.aspectDegrees}°`}
                              {" "}(orbe {contact.orb.toFixed(2)}°).
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No se registraron contactos dentro de los orbes configurados.</p>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs leading-5 text-slate-400">
        La comparación se calcula con los datos, el intervalo, las fechas de
        acontecimientos y los pesos de técnicas de este expediente. Cuanto más
        precisos sean tus datos de nacimiento y las fechas registradas, más
        ajustada será la comparación.
      </p>
    </div>
  );
}
