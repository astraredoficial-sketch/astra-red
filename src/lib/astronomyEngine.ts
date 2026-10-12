import * as SunCalc from "suncalc";
import * as Astronomy from "astronomy-engine";
import { signFromLongitude } from "./astro/constants";

export const ASTRAL_ACTIVITIES = [
  "hair-growth",
  "hair-maintenance",
  "planting",
  "pruning-harvest",
  "moon-observation",
  "home-search",
  "home-purchase",
  "home-move",
  "vehicle-purchase",
  "vehicle-first-drive",
  "engagement",
  "wedding",
  "business-launch",
  "job-interview",
  "travel",
  "contract-signing",
] as const;

export type AstralActivity = (typeof ASTRAL_ACTIVITIES)[number];

export interface AstralCalculationResult {
  date: string;
  phaseName: string;
  phaseValue: number;
  illumination: number;
  moonSign: string;
  mercuryRetrograde: boolean;
  venusRetrograde: boolean;
  score: number;
  recommendation: string;
}

export interface AstralCalendarDay extends AstralCalculationResult {
  day: number;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type ActivityGuidance = {
  phase: "waxing" | "waning" | "any";
  moonSigns: number[];
  mercurySensitive?: boolean;
  venusSensitive?: boolean;
};

const ACTIVITY_GUIDANCE: Record<AstralActivity, ActivityGuidance> = {
  "hair-growth": { phase: "waxing", moonSigns: [1, 3, 5, 11] },
  "hair-maintenance": { phase: "waning", moonSigns: [5, 9, 10] },
  planting: { phase: "waxing", moonSigns: [1, 3, 4, 11] },
  "pruning-harvest": { phase: "waning", moonSigns: [5, 9, 10] },
  "moon-observation": { phase: "any", moonSigns: [] },
  "home-search": { phase: "waxing", moonSigns: [1, 3, 5, 9] },
  "home-purchase": {
    phase: "waxing",
    moonSigns: [1, 3, 6, 9],
    mercurySensitive: true,
  },
  "home-move": { phase: "waxing", moonSigns: [1, 3, 5, 6] },
  "vehicle-purchase": {
    phase: "waxing",
    moonSigns: [1, 2, 6, 9],
    mercurySensitive: true,
  },
  "vehicle-first-drive": {
    phase: "waxing",
    moonSigns: [0, 2, 8],
    mercurySensitive: true,
  },
  engagement: {
    phase: "waxing",
    moonSigns: [1, 6, 11],
    venusSensitive: true,
  },
  wedding: {
    phase: "waxing",
    moonSigns: [1, 3, 6, 11],
    venusSensitive: true,
  },
  "business-launch": {
    phase: "waxing",
    moonSigns: [0, 4, 8, 9],
    mercurySensitive: true,
  },
  "job-interview": {
    phase: "waxing",
    moonSigns: [2, 4, 6],
    mercurySensitive: true,
  },
  travel: {
    phase: "waxing",
    moonSigns: [2, 8, 11],
    mercurySensitive: true,
  },
  "contract-signing": {
    phase: "waxing",
    moonSigns: [2, 5, 6],
    mercurySensitive: true,
  },
};

function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

function geocentricLongitude(
  body: Astronomy.Body,
  date: Date,
): number {
  const time = Astronomy.MakeTime(date);
  if (body === Astronomy.Body.Moon) {
    return normalizeLongitude(Astronomy.EclipticGeoMoon(time).lon);
  }
  const vector = Astronomy.GeoVector(body, time, true);
  return normalizeLongitude(Astronomy.Ecliptic(vector).elon);
}

function isRetrograde(body: Astronomy.Body, date: Date): boolean {
  const halfDay = 12 * 60 * 60 * 1000;
  const previous = geocentricLongitude(
    body,
    new Date(date.getTime() - halfDay),
  );
  const next = geocentricLongitude(
    body,
    new Date(date.getTime() + halfDay),
  );
  let longitudeChange = next - previous;
  if (longitudeChange > 180) longitudeChange -= 360;
  if (longitudeChange < -180) longitudeChange += 360;
  return longitudeChange < -0.02;
}

function getPhaseName(phase: number): string {
  if (phase < 0.03 || phase >= 0.97) return "Luna nueva";
  if (phase < 0.22) return "Luna creciente";
  if (phase < 0.28) return "Cuarto creciente";
  if (phase < 0.47) return "Luna gibosa creciente";
  if (phase < 0.53) return "Luna llena";
  if (phase < 0.72) return "Luna gibosa menguante";
  if (phase < 0.78) return "Cuarto menguante";
  return "Luna menguante";
}

function getRecommendation(
  activity: AstralActivity,
  phase: number,
  moonSign: string,
  moonSignIndex: number,
  mercuryRetrograde: boolean,
  venusRetrograde: boolean,
): string {
  const guidance = ACTIVITY_GUIDANCE[activity];
  const isWaxing = phase >= 0.03 && phase < 0.5;
  const phaseText =
    phase < 0.03 || phase >= 0.97
      ? "Luna nueva"
      : phase < 0.5
        ? "Luna creciente"
        : phase < 0.53
          ? "Luna llena"
          : "Luna menguante";
  const reasons = [`${phaseText}`, `Luna en ${moonSign}`];

  if (guidance.moonSigns.length > 0) {
    reasons.push(
      guidance.moonSigns.includes(moonSignIndex)
        ? "signo lunar afín a esta intención según la tradición"
        : "signo lunar menos asociado con esta intención en esta guía",
    );
  }
  if (guidance.phase !== "any") {
    reasons.push(
      isWaxing === (guidance.phase === "waxing")
        ? `fase ${guidance.phase === "waxing" ? "creciente" : "menguante"} afín a esta intención`
        : `la fase ${isWaxing ? "creciente" : "menguante"} no es la preferida para esta intención`,
    );
  }
  if (guidance.mercurySensitive) {
    reasons.push(
      mercuryRetrograde
        ? "Mercurio retrógrado invita a revisar fechas, documentos y detalles antes de avanzar"
        : "Mercurio directo favorece, según la tradición, acuerdos y coordinación",
    );
  }
  if (guidance.venusSensitive) {
    reasons.push(
      venusRetrograde
        ? "Venus retrógrado sugiere revisar con calma expectativas y acuerdos afectivos"
        : "Venus directo acompaña simbólicamente los asuntos de unión y armonía",
    );
  }
  if (activity === "moon-observation") {
    return `Referencia lunar: ${reasons.join("; ")}. La visibilidad también depende del clima, el horizonte y la contaminación lumínica.`;
  }
  if (activity === "planting") {
    return `La tradición astrológica asocia ${reasons.join("; ")} con la siembra. Considera también la especie, el clima y el suelo.`;
  }
  if (activity === "hair-growth" || activity === "hair-maintenance") {
    return `La tradición astrológica asocia ${reasons.join("; ")} con el cuidado del cabello.`;
  }
  if (activity === "pruning-harvest") {
    return `La tradición astrológica asocia ${reasons.join("; ")} con la poda y la cosecha.`;
  }
  return `Lectura astrológica: ${reasons.join("; ")}. Úsala como orientación simbólica junto con tus circunstancias y asesoría práctica.`;
}

function getActivityScore(
  activity: AstralActivity,
  phase: number,
  moonSignIndex: number,
  mercuryRetrograde: boolean,
  venusRetrograde: boolean,
): number {
  const guidance = ACTIVITY_GUIDANCE[activity];
  const isWaxing = phase >= 0.03 && phase < 0.5;
  let score = 50;

  if (guidance.phase !== "any") {
    score +=
      isWaxing === (guidance.phase === "waxing") ? 20 : -15;
  } else {
    score += Math.round((1 - Math.abs(phase - 0.5) * 2) * 30);
  }
  if (guidance.moonSigns.includes(moonSignIndex)) score += 25;
  if (guidance.mercurySensitive && mercuryRetrograde) score -= 25;
  if (guidance.venusSensitive && venusRetrograde) score -= 25;
  return Math.max(0, Math.min(100, score));
}

function assertMonthRange(
  year: number,
  startMonth: number,
  endMonth: number,
): void {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError("El año debe ser un entero entre 1 y 9999.");
  }
  if (
    !Number.isInteger(startMonth) ||
    !Number.isInteger(endMonth) ||
    startMonth < 1 ||
    endMonth > 12 ||
    startMonth > endMonth
  ) {
    throw new RangeError("Indica un rango de meses válido entre 1 y 12.");
  }
}

function calculateForDate(
  targetDate: Date,
  activity: AstralActivity,
): AstralCalculationResult {
  const illumination = SunCalc.getMoonIllumination(targetDate);
  const moonLongitude = geocentricLongitude(Astronomy.Body.Moon, targetDate);
  const moonSign = signFromLongitude(moonLongitude);
  const mercuryRetrograde = isRetrograde(
    Astronomy.Body.Mercury,
    targetDate,
  );
  const venusRetrograde = isRetrograde(Astronomy.Body.Venus, targetDate);

  return {
    date: toIsoDate(targetDate),
    phaseName: getPhaseName(illumination.phase),
    phaseValue: illumination.phase,
    illumination: Math.round(illumination.fraction * 100),
    moonSign: moonSign.sign,
    mercuryRetrograde,
    venusRetrograde,
    score: getActivityScore(
      activity,
      illumination.phase,
      moonSign.signIndex,
      mercuryRetrograde,
      venusRetrograde,
    ),
    recommendation: getRecommendation(
      activity,
      illumination.phase,
      moonSign.sign,
      moonSign.signIndex,
      mercuryRetrograde,
      venusRetrograde,
    ),
  };
}

export function calculateRealAstralData(
  targetDate: Date,
  activity: AstralActivity,
): AstralCalculationResult {
  if (!Number.isFinite(targetDate.getTime())) {
    throw new RangeError("La fecha seleccionada no es válida.");
  }
  return calculateForDate(targetDate, activity);
}

export function getAstralCalendarDays(
  year: number,
  month: number,
): AstralCalendarDay[] {
  assertMonthRange(year, month, month);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const result = calculateForDate(
      new Date(Date.UTC(year, month - 1, day, 12)),
      "moon-observation",
    );
    return { ...result, day };
  });
}

export function findOptimalAstralDates(
  activity: AstralActivity,
  year: number,
  startMonth: number,
  endMonth: number,
): AstralCalculationResult[] {
  assertMonthRange(year, startMonth, endMonth);
  const results: AstralCalculationResult[] = [];

  for (let month = startMonth; month <= endMonth; month += 1) {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const matchingDates: AstralCalculationResult[] = [];
    const guidance = ACTIVITY_GUIDANCE[activity];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(Date.UTC(year, month - 1, day, 12));
      const result = calculateForDate(date, activity);
      const phaseIsWaxing =
        result.phaseValue >= 0.03 && result.phaseValue < 0.5;
      const phaseIsWaning =
        result.phaseValue > 0.5 && result.phaseValue < 0.97;

      if (
        guidance.phase === "any" ||
        (guidance.phase === "waxing" && phaseIsWaxing) ||
        (guidance.phase === "waning" && phaseIsWaning)
      ) {
        matchingDates.push(result);
      }
    }

    const numberToSelect = Math.min(3, matchingDates.length);
    for (let index = 0; index < numberToSelect; index += 1) {
      const start = Math.floor((index * matchingDates.length) / numberToSelect);
      const end = Math.floor(((index + 1) * matchingDates.length) / numberToSelect);
      const bestDate = matchingDates
        .slice(start, end)
        .reduce((best, candidate) =>
          candidate.score > best.score ? candidate : best,
        );
      results.push(bestDate);
    }
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}
