import * as Astronomy from "astronomy-engine";

const SEARCH_STEP_MS = 6 * 60 * 60 * 1000;
const BINARY_TOLERANCE_MS = 1000;

function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

function lunarPhaseFromTarget(
  targetLongitude: number,
  instant: Date,
): number {
  const moonLongitude = Astronomy.EclipticGeoMoon(instant).lon;
  return normalizeLongitude(moonLongitude - targetLongitude);
}

/**
 * Finds the next ascending crossing of the natal Moon longitude.
 * The returned instant is in UTC. If the birth time is unknown,
 * the caller must mark the result as approximate.
 */
export function findNextLunarReturn(
  natalMoonLongitude: number,
  from: Date = new Date(),
  maxDays = 40,
): Date {
  if (
    !Number.isFinite(natalMoonLongitude) ||
    natalMoonLongitude < 0 ||
    natalMoonLongitude >= 360
  ) {
    throw new RangeError("Natal Moon longitude must be in [0, 360).");
  }

  if (!(from instanceof Date) || !Number.isFinite(from.getTime())) {
    throw new RangeError("The starting instant must be a valid Date.");
  }

  if (!Number.isFinite(maxDays) || maxDays <= 0 || maxDays > 90) {
    throw new RangeError("maxDays must be greater than 0 and at most 90.");
  }

  const startMs = from.getTime();
  const endMs = startMs + maxDays * 24 * 60 * 60 * 1000;

  let previousMs = startMs;
  let previousPhase = lunarPhaseFromTarget(
    natalMoonLongitude,
    new Date(previousMs),
  );

  for (
    let currentMs = Math.min(previousMs + SEARCH_STEP_MS, endMs);
    previousMs < endMs;
    currentMs = Math.min(currentMs + SEARCH_STEP_MS, endMs)
  ) {
    const currentPhase = lunarPhaseFromTarget(
      natalMoonLongitude,
      new Date(currentMs),
    );

    // The phase wraps from near 360° to near 0° at the return.
    if (previousPhase > 180 && currentPhase <= 180) {
      let low = previousMs;
      let high = currentMs;

      while (high - low > BINARY_TOLERANCE_MS) {
        const middle = Math.floor((low + high) / 2);
        const middlePhase = lunarPhaseFromTarget(
          natalMoonLongitude,
          new Date(middle),
        );

        if (middlePhase > 180) {
          low = middle;
        } else {
          high = middle;
        }
      }

      return new Date(high);
    }

    previousMs = currentMs;
    previousPhase = currentPhase;

    if (currentMs >= endMs) break;
  }

  throw new RangeError(
    `No lunar return found within ${maxDays} days.`,
  );
}