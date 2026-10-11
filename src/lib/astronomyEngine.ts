import * as SunCalc from "suncalc";

export const ASTRAL_ACTIVITIES = [
  "hair-growth",
  "hair-maintenance",
  "planting",
  "pruning-harvest",
  "moon-observation",
] as const;

export type AstralActivity = (typeof ASTRAL_ACTIVITIES)[number];

export interface AstralCalculationResult {
  date: string;
  phaseName: string;
  phaseValue: number;
  illumination: number;
  recommendation: string;
}

export interface AstralCalendarDay extends AstralCalculationResult {
  day: number;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function activityIsWaxing(activity: AstralActivity): boolean | null {
  if (activity === "hair-growth" || activity === "planting") return true;
  if (activity === "hair-maintenance" || activity === "pruning-harvest") {
    return false;
  }
  return null;
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

function getRecommendation(activity: AstralActivity): string {
  switch (activity) {
    case "hair-growth":
      return "La tradición astrológica lunar asocia la fase creciente con el crecimiento. Es una guía simbólica, no una garantía científica.";
    case "hair-maintenance":
    case "pruning-harvest":
      return "La tradición astrológica lunar asocia la fase menguante con el mantenimiento, la poda y la cosecha. Es una guía simbólica, no una garantía científica.";
    case "planting":
      return "La tradición astrológica lunar asocia la fase creciente con la siembra. El resultado real también depende de la especie, el clima y el suelo.";
    case "moon-observation":
      return "Una referencia para planificar la observación lunar. La visibilidad depende del clima, el horizonte y la contaminación lumínica.";
  }
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

  return {
    date: toIsoDate(targetDate),
    phaseName: getPhaseName(illumination.phase),
    phaseValue: illumination.phase,
    illumination: Math.round(illumination.fraction * 100),
    recommendation: getRecommendation(activity),
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
  const waxingPreference = activityIsWaxing(activity);
  const results: AstralCalculationResult[] = [];

  for (let month = startMonth; month <= endMonth; month += 1) {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const matchingDates: AstralCalculationResult[] = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(Date.UTC(year, month - 1, day, 12));
      const result = calculateForDate(date, activity);
      const isWaxing = result.phaseValue < 0.5;

      if (waxingPreference === null || isWaxing === waxingPreference) {
        matchingDates.push(result);
      }
    }

    const numberToSelect = Math.min(3, matchingDates.length);
    for (let index = 0; index < numberToSelect; index += 1) {
      const position =
        numberToSelect === 1
          ? Math.floor((matchingDates.length - 1) / 2)
          : Math.round(
              (index * (matchingDates.length - 1)) / (numberToSelect - 1),
            );
      results.push(matchingDates[position]);
    }
  }

  return results;
}
