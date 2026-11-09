import {
  civilToUtcCandidates,
  NonexistentCivilTimeError,
} from "../time";

const MAX_CANDIDATES = 300;

export type CandidateOccurrence = "unique" | "earlier" | "later";

export interface BirthTimeCandidate {
  localDate: string;
  localTime: string;
  utc: string;
  occurrence: CandidateOccurrence;
}

export interface CandidateGenerationResult {
  candidates: BirthTimeCandidate[];
  skippedNonexistentLocalTimes: number;
  stepMinutes: number;
}

export interface LocalDateTime {
  date: string;
  time: string;
}

function localDateTimeToWallClock(value: LocalDateTime): number {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(value.time);
  if (!dateMatch || !timeMatch) {
    throw new RangeError("La fecha y hora local deben usar AAAA-MM-DD y HH:mm.");
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const wallClock = new Date(0);
  wallClock.setUTCFullYear(year, month - 1, day);
  wallClock.setUTCHours(hour, minute, 0, 0);

  if (
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    hour > 23 ||
    minute > 59 ||
    wallClock.getUTCFullYear() !== year ||
    wallClock.getUTCMonth() !== month - 1 ||
    wallClock.getUTCDate() !== day
  ) {
    throw new RangeError("La fecha y hora local no son válidas.");
  }

  return wallClock.getTime();
}

function formatWallClock(wallClock: Date): LocalDateTime {
  return {
    date: [
      String(wallClock.getUTCFullYear()).padStart(4, "0"),
      String(wallClock.getUTCMonth() + 1).padStart(2, "0"),
      String(wallClock.getUTCDate()).padStart(2, "0"),
    ].join("-"),
    time: [
      String(wallClock.getUTCHours()).padStart(2, "0"),
      String(wallClock.getUTCMinutes()).padStart(2, "0"),
    ].join(":"),
  };
}

export function generateBirthTimeCandidates(
  start: LocalDateTime,
  end: LocalDateTime,
  timeZone: string,
  stepMinutes = 5,
): CandidateGenerationResult {
  if (!Number.isInteger(stepMinutes) || stepMinutes < 1 || stepMinutes > 1440) {
    throw new RangeError("El paso debe ser un entero entre 1 y 1440 minutos.");
  }

  const startMs = localDateTimeToWallClock(start);
  const endMs = localDateTimeToWallClock(end);
  if (endMs < startMs) {
    throw new RangeError("El final del intervalo debe ser posterior al inicio.");
  }

  const stepMs = stepMinutes * 60_000;
  const gridSize = Math.floor((endMs - startMs) / stepMs) + 1;
  if (gridSize > MAX_CANDIDATES) {
    throw new RangeError(
      `El intervalo supera el máximo de ${MAX_CANDIDATES} candidatos.`,
    );
  }

  const candidates: BirthTimeCandidate[] = [];
  let skippedNonexistentLocalTimes = 0;

  for (let wallClockMs = startMs; wallClockMs <= endMs; wallClockMs += stepMs) {
    const local = formatWallClock(new Date(wallClockMs));
    let instants: Date[];
    try {
      instants = civilToUtcCandidates(local.date, local.time, timeZone);
    } catch (error) {
      if (error instanceof NonexistentCivilTimeError) {
        skippedNonexistentLocalTimes += 1;
        continue;
      }
      throw error;
    }

    for (let index = 0; index < instants.length; index += 1) {
      if (candidates.length >= MAX_CANDIDATES) {
        throw new RangeError(
          `El intervalo supera el máximo de ${MAX_CANDIDATES} candidatos.`,
        );
      }

      candidates.push({
        localDate: local.date,
        localTime: local.time,
        utc: instants[index].toISOString(),
        occurrence:
          instants.length === 1 ? "unique" : index === 0 ? "earlier" : "later",
      });
    }
  }

  if (candidates.length === 0) {
    throw new RangeError("El intervalo no contiene horas locales válidas.");
  }

  candidates.sort((a, b) => Date.parse(a.utc) - Date.parse(b.utc));

  return {
    candidates,
    skippedNonexistentLocalTimes,
    stepMinutes,
  };
}
