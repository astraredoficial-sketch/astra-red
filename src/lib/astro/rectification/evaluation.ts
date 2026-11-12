import { angleDelta } from "../constants";
import {
  computeNatalAnglesAtUtc,
  computeNatalChartAtUtc,
  computePlanetaryLongitudesAtUtc,
} from "../chart";
import { civilToUtcCandidates, NonexistentCivilTimeError } from "../time";
import type { BirthData, NatalChart, PlanetId } from "@/lib/types";
import type { BirthTimeCandidate } from "./candidates";
import { RECTIFICATION_EVENT_CATEGORIES } from "./validation";

export const RECTIFICATION_METHOD_VERSION = "traditional-v1";

const TROPICAL_YEAR_DAYS = 365.24219;
const MAX_CANDIDATES_PER_EVALUATION = 300;
const MAX_EVENTS_PER_EVALUATION = 50;
const MAX_EVENT_DATE_SAMPLES = 31;
const MAX_CANDIDATE_EVENT_SAMPLES = 10_000;
const TRADITIONAL_PLANETS = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
] as const satisfies readonly PlanetId[];
const ASPECT_ANGLES = [0, 60, 90, 120, 180] as const;
const EVENT_CATEGORY_SET = new Set<string>(RECTIFICATION_EVENT_CATEGORIES);
const TRADITIONAL_PLANET_SET = new Set<string>(TRADITIONAL_PLANETS);
const EVENT_DATE_PRECISIONS = new Set([
  "exact",
  "approximate",
  "month",
  "year",
  "interval",
]);
const TRADITIONAL_SIGN_RULERS: readonly PlanetId[] = [
  "mars",
  "venus",
  "mercury",
  "moon",
  "sun",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "saturn",
  "jupiter",
];

type TechniqueId = "transits" | "secondaryProgressions" | "solarArc";
type HousePointId = "mc" | "ic" | "dsc";
type ChartPointId = PlanetId | HousePointId;
type TechniqueScores = Record<TechniqueId, number>;

interface PeakContact {
  technique: TechniqueId;
  factor: ChartPointId;
  target: ChartPointId;
  aspectDegrees: number;
  orb: number;
  strength: number;
  atUtc: string;
}

interface TechniqueEvaluation {
  scores: TechniqueScores;
  peakContacts: PeakContact[];
}

interface ProgressedPositions {
  planets: Partial<Record<PlanetId, number>>;
  angles?: ReturnType<typeof computeNatalAnglesAtUtc>;
}

interface SampledEvent {
  event: RectificationEvent;
  samples: ReturnType<typeof sampleEventInstants>;
}

export interface RectificationEvent {
  id: string;
  category: (typeof RECTIFICATION_EVENT_CATEGORIES)[number];
  dateStart: string;
  dateEnd: string;
  datePrecision: "exact" | "approximate" | "month" | "year" | "interval";
  eventTimeZone: string | null;
  relevance: number;
}

export interface RectificationEvaluationInput {
  birthDate: string;
  birthLocation: {
    latitude: number;
    longitude: number;
    timeZone: string;
  };
  candidates: BirthTimeCandidate[];
  events: RectificationEvent[];
}

export interface RectificationEvaluationConfig {
  techniqueWeights: TechniqueScores;
  orbLimits: TechniqueScores;
  ambiguityMargin: number;
  minimumEvidenceScore: number;
}

export interface RectificationCandidateResult extends BirthTimeCandidate {
  score: number;
  eventEvidence: {
    eventId: string;
    category: RectificationEvent["category"];
    relevance: number;
    datePrecision: RectificationEvent["datePrecision"];
    timezoneUsed: string;
    timezoneSource: "event" | "birth";
    sampleCount: number;
    skippedNonexistentLocalTimes: number;
    techniqueScores: TechniqueScores;
    combinedScore: number;
    peakContacts: PeakContact[];
  }[];
  sensitivity: {
    minScoreWithoutOneEvent: number | null;
    maxScoreWithoutOneEvent: number | null;
  };
}

export interface RectificationEvaluationResult {
  methodologyVersion: string;
  astronomicalConfiguration: {
    engine: "astronomy-engine@2.1.19";
    coordinateSystem: "geocentric true ecliptic of date";
    zodiac: "tropical";
    timeScales: "UTC approximated as UT1; TT uses Astronomy Engine delta-T model";
    houses: "Placidus; equal houses when Placidus is unavailable";
    progressedDayPerYear: number;
    aspects: readonly number[];
    orbLimits: TechniqueScores;
    normalizedTechniqueWeights: TechniqueScores;
  };
  status: "insufficient_evidence" | "ambiguous" | "relative_ranking";
  recommendedCandidateUtc: null;
  scoreGap: number | null;
  candidates: RectificationCandidateResult[];
  limitations: string[];
}

export const DEFAULT_RECTIFICATION_EVALUATION_CONFIG: RectificationEvaluationConfig =
  {
    techniqueWeights: {
      transits: 1,
      secondaryProgressions: 1,
      solarArc: 1,
    },
    orbLimits: {
      transits: 2,
      secondaryProgressions: 1,
      solarArc: 1,
    },
    ambiguityMargin: 0.03,
    minimumEvidenceScore: 0.1,
  };

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
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

function normalizeWeights(weights: TechniqueScores): TechniqueScores {
  const values = Object.values(weights);
  if (values.some((weight) => !Number.isFinite(weight) || weight < 0)) {
    throw new RangeError("Los pesos de las técnicas deben ser finitos y no negativos.");
  }
  const total = values.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) {
    throw new RangeError("Al menos una técnica debe tener peso mayor que cero.");
  }
  return {
    transits: weights.transits / total,
    secondaryProgressions: weights.secondaryProgressions / total,
    solarArc: weights.solarArc / total,
  };
}

function validateConfig(config: RectificationEvaluationConfig): TechniqueScores {
  const normalizedWeights = normalizeWeights(config.techniqueWeights);
  if (
    Object.values(config.orbLimits).some(
      (orb) => !Number.isFinite(orb) || orb <= 0 || orb > 10,
    )
  ) {
    throw new RangeError("Los orbes deben ser mayores que cero y no superar 10 grados.");
  }
  if (
    !Number.isFinite(config.ambiguityMargin) ||
    config.ambiguityMargin < 0 ||
    config.ambiguityMargin > 1
  ) {
    throw new RangeError("El margen de ambigüedad debe estar entre 0 y 1.");
  }
  if (
    !Number.isFinite(config.minimumEvidenceScore) ||
    config.minimumEvidenceScore < 0 ||
    config.minimumEvidenceScore > 1
  ) {
    throw new RangeError("El umbral mínimo de evidencia debe estar entre 0 y 1.");
  }
  return normalizedWeights;
}

function localDateToUtcDay(date: string): number {
  if (!isValidDate(date)) {
    throw new RangeError("La fecha del acontecimiento no es válida.");
  }
  const [year, month, day] = date.split("-").map(Number);
  const instant = new Date(0);
  instant.setUTCFullYear(year, month - 1, day);
  instant.setUTCHours(0, 0, 0, 0);
  return instant.getTime();
}

function formatUtcDay(instant: Date): string {
  return [
    String(instant.getUTCFullYear()).padStart(4, "0"),
    String(instant.getUTCMonth() + 1).padStart(2, "0"),
    String(instant.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function sampleEventInstants(
  event: RectificationEvent,
  birthTimeZone: string,
): { instants: Date[]; skippedLocalTimes: number; timeZone: string; source: "event" | "birth" } {
  if (
    !EVENT_CATEGORY_SET.has(event.category) ||
    !EVENT_DATE_PRECISIONS.has(event.datePrecision) ||
    !Number.isInteger(event.relevance) ||
    event.relevance < 1 ||
    event.relevance > 5
  ) {
    throw new RangeError("El acontecimiento no cumple el esquema de rectificación.");
  }

  const startDay = localDateToUtcDay(event.dateStart);
  const endDay = localDateToUtcDay(event.dateEnd);
  if (endDay < startDay) {
    throw new RangeError("El intervalo del acontecimiento está invertido.");
  }

  const timeZone = event.eventTimeZone ?? birthTimeZone;
  const source = event.eventTimeZone ? "event" : "birth";
  const dayCount = Math.floor((endDay - startDay) / 86_400_000);
  const sampleCount = Math.min(dayCount + 1, MAX_EVENT_DATE_SAMPLES);
  const instants: Date[] = [];
  let skippedLocalTimes = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const offsetDays =
      sampleCount === 1
        ? 0
        : Math.round((index * dayCount) / (sampleCount - 1));
    const date = formatUtcDay(new Date(startDay + offsetDays * 86_400_000));
    const localTimes =
      dayCount === 0
        ? ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]
        : ["12:00"];

    for (const localTime of localTimes) {
      try {
        instants.push(
          ...civilToUtcCandidates(date, localTime, timeZone),
        );
      } catch (error) {
        if (error instanceof NonexistentCivilTimeError) {
          skippedLocalTimes += 1;
          continue;
        }
        throw error;
      }
    }
  }

  const uniqueInstants = [
    ...new Map(
      instants.map((instant) => [instant.getTime(), instant]),
    ).values(),
  ].sort((a, b) => a.getTime() - b.getTime());

  if (uniqueInstants.length === 0) {
    throw new RangeError("No se pudieron muestrear fechas válidas para el acontecimiento.");
  }
  return {
    instants: uniqueInstants,
    skippedLocalTimes,
    timeZone,
    source,
  };
}

function chartPointPositions(chart: NatalChart): Partial<Record<ChartPointId, number>> {
  return {
    ...Object.fromEntries(
      chart.planets.map((planet) => [planet.id, planet.longitude]),
    ),
    mc: chart.houses[9],
    ic: chart.houses[3],
    dsc: chart.houses[6],
  };
}

function houseRuler(chart: NatalChart, house: number): PlanetId {
  const cusp = chart.houses[house - 1];
  const signIndex = Math.floor((((cusp % 360) + 360) % 360) / 30);
  return TRADITIONAL_SIGN_RULERS[signIndex];
}

function eventTargets(
  event: RectificationEvent,
  chart: NatalChart,
): ChartPointId[] {
  const rulers = (...houses: number[]) =>
    houses.map((house) => houseRuler(chart, house));
  const targets: Record<RectificationEvent["category"], ChartPointId[]> = {
    marriage: ["venus", "moon", "asc", "dsc", ...rulers(7)],
    separation: ["venus", "moon", "asc", "dsc", ...rulers(7)],
    child_birth: ["moon", "jupiter", "ic", ...rulers(5)],
    move: ["moon", "asc", "ic", ...rulers(4)],
    emigration: ["moon", "asc", "ic", ...rulers(4, 9)],
    career_change: ["sun", "saturn", "mc", ...rulers(6, 10)],
    promotion: ["sun", "saturn", "mc", ...rulers(10)],
    business: ["sun", "mercury", "jupiter", "mc", ...rulers(2, 10)],
    personal_crisis: ["moon", "saturn", "asc", ...rulers(1, 6, 8)],
    family_death: ["moon", "saturn", "ic", ...rulers(4, 8)],
    accident: ["mars", "saturn", "asc", ...rulers(1, 6, 8)],
    surgery: ["mars", "moon", "asc", ...rulers(1, 6, 8)],
    other: ["sun", "moon", "asc", "mc"],
  };
  return [...new Set(targets[event.category])];
}

function strongestAspect(
  first: number,
  second: number,
  orbLimit: number,
): { aspectDegrees: number; orb: number; strength: number } | null {
  const separation = angleDelta(first, second);
  let smallestOrb = Number.POSITIVE_INFINITY;
  let aspectDegrees = 0;
  for (const aspect of ASPECT_ANGLES) {
    const orb = Math.abs(separation - aspect);
    if (orb < smallestOrb) {
      smallestOrb = orb;
      aspectDegrees = aspect;
    }
  }
  if (smallestOrb > orbLimit) return null;
  return {
    aspectDegrees,
    orb: smallestOrb,
    strength: 1 - smallestOrb / orbLimit,
  };
}

function contactScore(
  factors: Partial<Record<ChartPointId, number>>,
  targets: Partial<Record<ChartPointId, number>>,
  targetIds: ChartPointId[],
  orbLimit: number,
  factorIds: ChartPointId[],
  technique: TechniqueId,
  atUtc: string,
): { score: number; contacts: PeakContact[] } {
  const contacts = targetIds.flatMap((targetId) => {
    const targetLongitude = targets[targetId];
    if (targetLongitude === undefined) return [];
    let best: PeakContact | null = null;
    for (const factorId of factorIds) {
      const factorLongitude = factors[factorId];
      if (factorLongitude === undefined) continue;
      const aspect = strongestAspect(
        factorLongitude,
        targetLongitude,
        orbLimit,
      );
      if (!aspect || (best && aspect.strength <= best.strength)) continue;
      best = {
        technique,
        factor: factorId,
        target: targetId,
        aspectDegrees: aspect.aspectDegrees,
        orb: aspect.orb,
        strength: aspect.strength,
        atUtc,
      };
    }
    return best ? [best] : [];
  });
  return {
    score:
      contacts.reduce((sum, contact) => sum + contact.strength, 0) /
      targetIds.length,
    contacts,
  };
}

function signedArc(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

function isDirectedChartPoint(point: string): point is ChartPointId {
  return (
    TRADITIONAL_PLANET_SET.has(point) ||
    point === "asc" ||
    point === "mc" ||
    point === "ic" ||
    point === "dsc"
  );
}

function directedPoints(
  natalPoints: Partial<Record<ChartPointId, number>>,
  arc: number,
): Partial<Record<ChartPointId, number>> {
  const directed: Partial<Record<ChartPointId, number>> = {};
  for (const [point, longitude] of Object.entries(natalPoints)) {
    if (longitude === undefined) continue;
    const directedLongitude = ((longitude + arc) % 360 + 360) % 360;
    if (isDirectedChartPoint(point)) {
      directed[point] = directedLongitude;
    }
  }
  return directed;
}

function computeTechniqueScores(
  event: RectificationEvent,
  eventInstants: Date[],
  birthInstant: Date,
  birthLocation: RectificationEvaluationInput["birthLocation"],
  natalChart: NatalChart,
  normalizedWeights: TechniqueScores,
  config: RectificationEvaluationConfig,
  transitCache: Map<number, Partial<Record<PlanetId, number>>>,
  progressedCache: Map<number, ProgressedPositions>,
): TechniqueEvaluation {
  const targets = chartPointPositions(natalChart);
  const targetIds = eventTargets(event, natalChart);
  const totals: TechniqueScores = {
    transits: 0,
    secondaryProgressions: 0,
    solarArc: 0,
  };
  const peakContacts = new Map<string, PeakContact>();

  for (const eventInstant of eventInstants) {
    const atUtc = eventInstant.toISOString();
    if (normalizedWeights.transits > 0) {
      const eventTime = eventInstant.getTime();
      let transits = transitCache.get(eventTime);
      if (!transits) {
        transits = computePlanetaryLongitudesAtUtc(eventInstant);
        transitCache.set(eventTime, transits);
      }
      const transitResult = contactScore(
        transits,
        targets,
        targetIds,
        config.orbLimits.transits,
        [...TRADITIONAL_PLANETS],
        "transits",
        atUtc,
      );
      totals.transits += transitResult.score / eventInstants.length;
      for (const contact of transitResult.contacts) {
        const key = `${contact.technique}:${contact.target}`;
        if ((peakContacts.get(key)?.strength ?? -1) < contact.strength) {
          peakContacts.set(key, contact);
        }
      }
    }

    const ageDays =
      (eventInstant.getTime() - birthInstant.getTime()) / 86_400_000;
    const progressedInstant = new Date(
      birthInstant.getTime() +
        (ageDays / TROPICAL_YEAR_DAYS) * 86_400_000,
    );
    const progressedTime = progressedInstant.getTime();
    let progressed = progressedCache.get(progressedTime);
    if (!progressed) {
      progressed = {
        planets:
          normalizedWeights.secondaryProgressions > 0 ||
          normalizedWeights.solarArc > 0
            ? computePlanetaryLongitudesAtUtc(progressedInstant)
            : {},
      };
      if (normalizedWeights.secondaryProgressions > 0) {
        progressed.angles = computeNatalAnglesAtUtc(
          progressedInstant,
          birthLocation.latitude,
          birthLocation.longitude,
        );
      }
      progressedCache.set(progressedTime, progressed);
    }
    if (normalizedWeights.secondaryProgressions > 0) {
      if (!progressed.angles) {
        throw new RangeError("No se pudieron calcular los ángulos progresados.");
      }
      const progressedResult = contactScore(
        {
          ...progressed.planets,
          asc: progressed.angles.ascendant,
          mc: progressed.angles.midheaven,
          dsc: progressed.angles.descendant,
          ic: progressed.angles.imumCoeli,
        },
        targets,
        targetIds,
        config.orbLimits.secondaryProgressions,
        [...TRADITIONAL_PLANETS, "asc", "mc", "dsc", "ic"],
        "secondaryProgressions",
        atUtc,
      );
      totals.secondaryProgressions +=
        progressedResult.score / eventInstants.length;
      for (const contact of progressedResult.contacts) {
        const key = `${contact.technique}:${contact.target}`;
        if ((peakContacts.get(key)?.strength ?? -1) < contact.strength) {
          peakContacts.set(key, contact);
        }
      }
    }

    if (normalizedWeights.solarArc > 0) {
      const natalSun = natalChart.planets.find((planet) => planet.id === "sun");
      const progressedSun = progressed.planets.sun;
      if (!natalSun || progressedSun === undefined) {
        throw new RangeError("No se pudo calcular el arco solar del candidato.");
      }
      const arc = signedArc(natalSun.longitude, progressedSun);
      const solarArcPoints = directedPoints(targets, arc);
      const solarArcResult = contactScore(
        solarArcPoints,
        targets,
        targetIds,
        config.orbLimits.solarArc,
        Object.keys(solarArcPoints) as ChartPointId[],
        "solarArc",
        atUtc,
      );
      totals.solarArc += solarArcResult.score / eventInstants.length;
      for (const contact of solarArcResult.contacts) {
        const key = `${contact.technique}:${contact.target}`;
        if ((peakContacts.get(key)?.strength ?? -1) < contact.strength) {
          peakContacts.set(key, contact);
        }
      }
    }
  }

  return { scores: totals, peakContacts: [...peakContacts.values()] };
}

function combinedTechniqueScore(
  scores: TechniqueScores,
  normalizedWeights: TechniqueScores,
): number {
  return (
    scores.transits * normalizedWeights.transits +
    scores.secondaryProgressions * normalizedWeights.secondaryProgressions +
    scores.solarArc * normalizedWeights.solarArc
  );
}

function evaluateCandidate(
  input: RectificationEvaluationInput,
  candidate: BirthTimeCandidate,
  sampledEvents: SampledEvent[],
  normalizedWeights: TechniqueScores,
  config: RectificationEvaluationConfig,
  transitCache: Map<number, Partial<Record<PlanetId, number>>>,
): RectificationCandidateResult {
  const birthInstant = new Date(candidate.utc);
  if (!Number.isFinite(birthInstant.getTime())) {
    throw new RangeError("Un candidato contiene un instante UTC no válido.");
  }

  const birthData: BirthData = {
    date: candidate.localDate,
    time: candidate.localTime,
    cityId: "",
    timeUnknown: false,
    location: input.birthLocation,
  };
  const natalChart = computeNatalChartAtUtc(birthData, birthInstant);
  const progressedCache = new Map<number, ProgressedPositions>();
  const eventEvidence = sampledEvents.map(({ event, samples }) => {
    const techniqueEvaluation = computeTechniqueScores(
      event,
      samples.instants,
      birthInstant,
      input.birthLocation,
      natalChart,
      normalizedWeights,
      config,
      transitCache,
      progressedCache,
    );
    return {
      eventId: event.id,
      category: event.category,
      relevance: event.relevance,
      datePrecision: event.datePrecision,
      timezoneUsed: samples.timeZone,
      timezoneSource: samples.source,
      sampleCount: samples.instants.length,
      skippedNonexistentLocalTimes: samples.skippedLocalTimes,
      techniqueScores: techniqueEvaluation.scores,
      combinedScore: combinedTechniqueScore(
        techniqueEvaluation.scores,
        normalizedWeights,
      ),
      peakContacts: techniqueEvaluation.peakContacts,
    };
  });

  const totalRelevance = eventEvidence.reduce(
    (sum, evidence) => sum + evidence.relevance,
    0,
  );
  const score =
    totalRelevance === 0
      ? 0
      : eventEvidence.reduce(
          (sum, evidence) => sum + evidence.combinedScore * evidence.relevance,
          0,
        ) / totalRelevance;

  const leaveOneOutScores =
    eventEvidence.length < 2
      ? []
      : eventEvidence.map((omitted) => {
          const remainingRelevance = totalRelevance - omitted.relevance;
          return (
            eventEvidence.reduce(
              (sum, evidence) =>
                evidence.eventId === omitted.eventId
                  ? sum
                  : sum + evidence.combinedScore * evidence.relevance,
              0,
            ) / remainingRelevance
          );
        });

  return {
    ...candidate,
    score,
    eventEvidence,
    sensitivity: {
      minScoreWithoutOneEvent:
        leaveOneOutScores.length > 0 ? Math.min(...leaveOneOutScores) : null,
      maxScoreWithoutOneEvent:
        leaveOneOutScores.length > 0 ? Math.max(...leaveOneOutScores) : null,
    },
  };
}

export function evaluateRectificationCandidates(
  input: RectificationEvaluationInput,
  config: RectificationEvaluationConfig = DEFAULT_RECTIFICATION_EVALUATION_CONFIG,
): RectificationEvaluationResult {
  const normalizedWeights = validateConfig(config);
  if (
    !isValidDate(input.birthDate) ||
    !Number.isFinite(input.birthLocation.latitude) ||
    input.birthLocation.latitude < -90 ||
    input.birthLocation.latitude > 90 ||
    !Number.isFinite(input.birthLocation.longitude) ||
    input.birthLocation.longitude < -180 ||
    input.birthLocation.longitude > 180
  ) {
    throw new RangeError("Los datos natales no son válidos.");
  }
  if (
    !input.birthLocation.timeZone ||
    input.candidates.length === 0 ||
    input.candidates.length > MAX_CANDIDATES_PER_EVALUATION
  ) {
    throw new RangeError(
      `La evaluación requiere candidatos y acepta un máximo de ${MAX_CANDIDATES_PER_EVALUATION}.`,
    );
  }
  if (
    input.events.length === 0 ||
    input.events.length > MAX_EVENTS_PER_EVALUATION
  ) {
    throw new RangeError(
      `La evaluación requiere acontecimientos y acepta un máximo de ${MAX_EVENTS_PER_EVALUATION}.`,
    );
  }

  const sampledEvents = input.events.map((event) => ({
    event,
    samples: sampleEventInstants(event, input.birthLocation.timeZone),
  }));
  const candidateEventSamples =
    input.candidates.length *
    sampledEvents.reduce((total, { samples }) => total + samples.instants.length, 0);
  if (candidateEventSamples > MAX_CANDIDATE_EVENT_SAMPLES) {
    throw new RangeError(
      `La evaluación supera el máximo de ${MAX_CANDIDATE_EVENT_SAMPLES} muestras candidato-acontecimiento; reduce candidatos o acontecimientos.`,
    );
  }

  const candidateInstants = new Set<string>();
  for (const candidate of input.candidates) {
    if (
      !isValidDate(candidate.localDate) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(candidate.localTime) ||
      !["unique", "earlier", "later"].includes(candidate.occurrence) ||
      !Number.isFinite(Date.parse(candidate.utc))
    ) {
      throw new RangeError("La lista contiene un candidato de nacimiento no válido.");
    }
    const candidateInstant = new Date(candidate.utc);
    if (candidateInstant.toISOString() !== candidate.utc) {
      throw new RangeError("El instante de cada candidato debe estar en UTC ISO.");
    }
    const localInstants = civilToUtcCandidates(
      candidate.localDate,
      candidate.localTime,
      input.birthLocation.timeZone,
    );
    const matchingIndex = localInstants.findIndex(
      (instant) => instant.toISOString() === candidate.utc,
    );
    const expectedOccurrence =
      localInstants.length === 1
        ? "unique"
        : matchingIndex === 0
          ? "earlier"
          : "later";
    if (matchingIndex < 0 || candidate.occurrence !== expectedOccurrence) {
      throw new RangeError(
        "La hora local, la zona horaria y el instante UTC del candidato no coinciden.",
      );
    }
    if (candidateInstants.has(candidate.utc)) {
      throw new RangeError("La lista no puede repetir instantes candidatos.");
    }
    candidateInstants.add(candidate.utc);
  }
  const eventIds = new Set(input.events.map((event) => event.id));
  if (
    eventIds.size !== input.events.length ||
    input.events.some((event) => !event.id.trim())
  ) {
    throw new RangeError("Cada acontecimiento debe tener un identificador único.");
  }

  const transitCache = new Map<number, Partial<Record<PlanetId, number>>>();
  const evaluated = input.candidates.map((candidate) =>
    evaluateCandidate(
      input,
      candidate,
      sampledEvents,
      normalizedWeights,
      config,
      transitCache,
    ),
  );
  evaluated.sort((a, b) => b.score - a.score || a.utc.localeCompare(b.utc));

  const best = evaluated[0];
  const second = evaluated[1];
  const scoreGap = second ? best.score - second.score : null;
  const status =
    best.score < config.minimumEvidenceScore
      ? "insufficient_evidence"
      : second && scoreGap !== null && scoreGap <= config.ambiguityMargin
        ? "ambiguous"
        : "relative_ranking";

  const limitations = [
    "Los puntajes comparan la correspondencia calculada entre cada carta candidata y los acontecimientos, según la metodología y los pesos configurados.",
    "El motor usa Astronomy Engine para calcular posiciones geocéntricas del zodiaco tropical; las fechas de los acontecimientos se evalúan mediante muestras representativas.",
    "Los acontecimientos sin zona horaria explícita se calculan en la zona natal indicada.",
    "La selección de indicadores por categoría y las regencias tradicionales siguen la metodología astrológica versionada.",
  ];

  return {
    methodologyVersion: RECTIFICATION_METHOD_VERSION,
    astronomicalConfiguration: {
      engine: "astronomy-engine@2.1.19",
      coordinateSystem: "geocentric true ecliptic of date",
      zodiac: "tropical",
      timeScales:
        "UTC approximated as UT1; TT uses Astronomy Engine delta-T model",
      houses: "Placidus; equal houses when Placidus is unavailable",
      progressedDayPerYear: TROPICAL_YEAR_DAYS,
      aspects: ASPECT_ANGLES,
      orbLimits: { ...config.orbLimits },
      normalizedTechniqueWeights: normalizedWeights,
    },
    status,
    recommendedCandidateUtc: null,
    scoreGap,
    candidates: evaluated,
    limitations,
  };
}
