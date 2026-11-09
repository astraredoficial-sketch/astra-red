import type { LocalDateTime } from "./candidates";

export const RECTIFICATION_EVENT_CATEGORIES = [
  "marriage",
  "separation",
  "child_birth",
  "move",
  "emigration",
  "career_change",
  "promotion",
  "business",
  "personal_crisis",
  "family_death",
  "accident",
  "surgery",
  "other",
] as const;

export const EVENT_DATE_PRECISIONS = [
  "exact",
  "approximate",
  "month",
  "year",
  "interval",
] as const;

const RECTIFICATION_FIELDS = new Set([
  "birthDate",
  "birthCity",
  "birthCountry",
  "latitude",
  "longitude",
  "timeZone",
  "intervalStart",
  "intervalEnd",
  "stepMinutes",
]);
const EVENT_FIELDS = new Set([
  "category",
  "dateStart",
  "dateEnd",
  "datePrecision",
  "eventTimeZone",
  "description",
  "relevance",
]);
const EVENT_CATEGORY_SET = new Set<string>(RECTIFICATION_EVENT_CATEGORIES);
const EVENT_DATE_PRECISION_SET = new Set<string>(EVENT_DATE_PRECISIONS);

function isEventCategory(
  value: unknown,
): value is RectificationEventInput["category"] {
  return typeof value === "string" && EVENT_CATEGORY_SET.has(value);
}

function isEventDatePrecision(
  value: unknown,
): value is RectificationEventInput["datePrecision"] {
  return typeof value === "string" && EVENT_DATE_PRECISION_SET.has(value);
}

export interface RectificationInput {
  birthDate: string;
  birthCity: string;
  birthCountry: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  intervalStart: LocalDateTime;
  intervalEnd: LocalDateTime;
  stepMinutes: number;
}

export interface RectificationEventInput {
  category: (typeof RECTIFICATION_EVENT_CATEGORIES)[number];
  dateStart: string;
  dateEnd: string;
  datePrecision: (typeof EVENT_DATE_PRECISIONS)[number];
  eventTimeZone: string | null;
  description: string | null;
  relevance: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requiredString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > maxLength
  ) {
    throw new RangeError(`${field} no es válido.`);
  }
  return value.trim();
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return (
    year >= 1 &&
    year <= 9999 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidLocalTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

function assertOnlyFields(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): void {
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new RangeError("La solicitud contiene campos no permitidos.");
  }
}

export function isValidIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function assertTimeZone(value: string, field: string): void {
  if (!isValidIanaTimeZone(value)) {
    throw new RangeError(`${field} debe ser una zona horaria IANA válida.`);
  }
}

export function validateRectificationInput(
  value: unknown,
): RectificationInput {
  if (!isRecord(value)) {
    throw new RangeError("Los datos de rectificación no son válidos.");
  }
  assertOnlyFields(value, RECTIFICATION_FIELDS);

  if (!isValidDate(value.birthDate)) {
    throw new RangeError("La fecha natal no es válida.");
  }

  if (
    typeof value.latitude !== "number" ||
    !Number.isFinite(value.latitude) ||
    value.latitude < -90 ||
    value.latitude > 90
  ) {
    throw new RangeError("La latitud debe estar entre -90 y 90.");
  }
  if (
    typeof value.longitude !== "number" ||
    !Number.isFinite(value.longitude) ||
    value.longitude < -180 ||
    value.longitude > 180
  ) {
    throw new RangeError("La longitud debe estar entre -180 y 180.");
  }

  const timeZone = requiredString(value.timeZone, "La zona horaria natal", 100);
  assertTimeZone(timeZone, "La zona horaria natal");

  if (
    !isRecord(value.intervalStart) ||
    !isValidDate(value.intervalStart.date) ||
    !isValidLocalTime(value.intervalStart.time) ||
    !isRecord(value.intervalEnd) ||
    !isValidDate(value.intervalEnd.date) ||
    !isValidLocalTime(value.intervalEnd.time)
  ) {
    throw new RangeError("El intervalo local no es válido.");
  }

  if (
    typeof value.stepMinutes !== "number" ||
    !Number.isInteger(value.stepMinutes) ||
    value.stepMinutes < 1 ||
    value.stepMinutes > 1440
  ) {
    throw new RangeError("El paso debe ser un entero entre 1 y 1440 minutos.");
  }

  const start = `${value.intervalStart.date}T${value.intervalStart.time}`;
  const end = `${value.intervalEnd.date}T${value.intervalEnd.time}`;
  if (end < start) {
    throw new RangeError("El final del intervalo debe ser posterior al inicio.");
  }
  if (
    value.birthDate < value.intervalStart.date ||
    value.birthDate > value.intervalEnd.date
  ) {
    throw new RangeError("La fecha natal debe quedar dentro del intervalo horario.");
  }

  return {
    birthDate: value.birthDate,
    birthCity: requiredString(value.birthCity, "La ciudad natal", 120),
    birthCountry: requiredString(value.birthCountry, "El país natal", 120),
    latitude: value.latitude,
    longitude: value.longitude,
    timeZone,
    intervalStart: {
      date: value.intervalStart.date,
      time: value.intervalStart.time,
    },
    intervalEnd: {
      date: value.intervalEnd.date,
      time: value.intervalEnd.time,
    },
    stepMinutes: value.stepMinutes,
  };
}

export function validateRectificationEventInput(
  value: unknown,
  partial = false,
): Partial<RectificationEventInput> {
  if (!isRecord(value)) {
    throw new RangeError("Los datos del acontecimiento no son válidos.");
  }
  assertOnlyFields(value, EVENT_FIELDS);
  if (partial && Object.keys(value).length === 0) {
    throw new RangeError("Indica al menos un campo para actualizar.");
  }

  const result: Partial<RectificationEventInput> = {};

  if (!partial || "category" in value) {
    if (!isEventCategory(value.category)) {
      throw new RangeError("La categoría del acontecimiento no es válida.");
    }
    result.category = value.category;
  }

  if (!partial || "dateStart" in value) {
    if (!isValidDate(value.dateStart)) {
      throw new RangeError("La fecha inicial del acontecimiento no es válida.");
    }
    result.dateStart = value.dateStart;
  }

  if (!partial || "dateEnd" in value) {
    if (!isValidDate(value.dateEnd)) {
      throw new RangeError("La fecha final del acontecimiento no es válida.");
    }
    result.dateEnd = value.dateEnd;
  }

  if (!partial || "datePrecision" in value) {
    if (!isEventDatePrecision(value.datePrecision)) {
      throw new RangeError("La precisión de la fecha no es válida.");
    }
    result.datePrecision = value.datePrecision;
  }

  if (!partial || "eventTimeZone" in value) {
    if (value.eventTimeZone === null || value.eventTimeZone === undefined) {
      result.eventTimeZone = null;
    } else {
      const eventTimeZone = requiredString(
        value.eventTimeZone,
        "La zona horaria del acontecimiento",
        100,
      );
      assertTimeZone(eventTimeZone, "La zona horaria del acontecimiento");
      result.eventTimeZone = eventTimeZone;
    }
  }

  if (!partial || "description" in value) {
    if (value.description === null || value.description === undefined) {
      result.description = null;
    } else if (
      typeof value.description !== "string" ||
      value.description.length > 2000
    ) {
      throw new RangeError("La descripción no puede superar 2000 caracteres.");
    } else {
      result.description = value.description.trim() || null;
    }
  }

  if (!partial || "relevance" in value) {
    if (
      typeof value.relevance !== "number" ||
      !Number.isInteger(value.relevance) ||
      value.relevance < 1 ||
      value.relevance > 5
    ) {
      throw new RangeError("La relevancia debe ser un entero entre 1 y 5.");
    }
    result.relevance = value.relevance;
  }

  const dateStart = result.dateStart ?? value.dateStart;
  const dateEnd = result.dateEnd ?? value.dateEnd;
  const datePrecision = result.datePrecision ?? value.datePrecision;
  if (
    isValidDate(dateStart) &&
    isValidDate(dateEnd) &&
    dateEnd < dateStart
  ) {
    throw new RangeError("La fecha final no puede preceder a la inicial.");
  }
  if (
    datePrecision === "exact" &&
    isValidDate(dateStart) &&
    isValidDate(dateEnd) &&
    dateStart !== dateEnd
  ) {
    throw new RangeError(
      "Un acontecimiento de precisión exacta debe tener una sola fecha.",
    );
  }

  return result;
}
