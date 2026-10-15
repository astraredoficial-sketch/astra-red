type Placement = {
  id: string;
  longitude: number;
};

type Chart = {
  planets: Placement[];
  timeUnknown: boolean;
};

const personal = new Set(["sun", "moon", "venus", "mars", "asc", "mercury"]);
const aspects = [
  { angle: 0, orb: 8, harmony: 0.92 },
  { angle: 60, orb: 6, harmony: 1 },
  { angle: 90, orb: 7, harmony: 0.48 },
  { angle: 120, orb: 8, harmony: 1 },
  { angle: 180, orb: 8, harmony: 0.58 },
];
const weights: Record<string, number> = {
  "moon-sun": 14,
  "mars-venus": 12,
  "asc-asc": 10,
  "sun-sun": 9,
  "moon-moon": 9,
  "venus-venus": 8,
  "sun-venus": 7,
  "asc-sun": 7,
  "asc-moon": 7,
  "moon-venus": 7,
  "mars-sun": 6,
  "node-sun": 9,
  "moon-node": 9,
  "node-venus": 8,
  "asc-node": 8,
  "mars-node": 6,
};

function parseChart(value: unknown): Chart | null {
  if (!value || typeof value !== "object") return null;
  const chart = value as Record<string, unknown>;
  if (
    typeof chart.timeUnknown !== "boolean" ||
    !Array.isArray(chart.planets)
  ) {
    return null;
  }
  const planets = chart.planets.flatMap((value): Placement[] => {
    if (!value || typeof value !== "object") return [];
    const placement = value as Record<string, unknown>;
    if (
      typeof placement.id !== "string" ||
      typeof placement.longitude !== "number" ||
      !Number.isFinite(placement.longitude)
    ) {
      return [];
    }
    return [{ id: placement.id, longitude: placement.longitude }];
  });
  return planets.length ? { planets, timeUnknown: chart.timeUnknown } : null;
}

function pairWeight(a: string, b: string) {
  return weights[[a, b].sort().join("-")] ?? 3;
}

export function compatibilityPercent(first: unknown, second: unknown) {
  const a = parseChart(first);
  const b = parseChart(second);
  if (!a || !b) return null;

  let scored = 0;
  let max = 0;
  for (const pa of a.planets) {
    for (const pb of b.planets) {
      if (
        (a.timeUnknown || b.timeUnknown) &&
        (pa.id === "asc" ||
          pa.id === "moon" ||
          pb.id === "asc" ||
          pb.id === "moon")
      ) {
        continue;
      }
      if (pa.id === "asc" && !personal.has(pb.id)) continue;
      if (pb.id === "asc" && !personal.has(pa.id)) continue;

      const weight = pairWeight(pa.id, pb.id);
      max += weight;
      const rawDelta = Math.abs(pa.longitude - pb.longitude) % 360;
      const delta = rawDelta > 180 ? 360 - rawDelta : rawDelta;
      const aspect = aspects.find(
        (candidate) => Math.abs(delta - candidate.angle) <= candidate.orb,
      );
      if (!aspect) continue;
      const orb = Math.abs(delta - aspect.angle);
      scored += weight * (1 - orb / aspect.orb) * aspect.harmony;
    }
  }

  const ratio = max > 0 ? scored / max : 0;
  return Math.round(Math.min(100, Math.max(18, 18 + ratio * 250)));
}
