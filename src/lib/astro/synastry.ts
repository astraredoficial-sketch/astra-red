import type {
  AspectName,
  NatalChart,
  PlanetId,
  SynastryAspect,
  SynastryResult,
} from "@/lib/types";
import { angleDelta, ASPECT_META } from "./constants";

const PERSONAL: PlanetId[] = ["sun", "moon", "venus", "mars", "asc", "mercury"];

function pairWeight(a: PlanetId, b: PlanetId): number {
  const key = [a, b].sort().join("-");
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
  return weights[key] ?? 3;
}

function aspectHarmony(type: AspectName): number {
  switch (type) {
    case "trine":
    case "sextile":
      return 1;
    case "conjunction":
      return 0.92;
    case "opposition":
      return 0.58;
    case "square":
      return 0.48;
  }
}

function findAspect(delta: number): { type: AspectName; orb: number } | null {
  for (const type of Object.keys(ASPECT_META) as AspectName[]) {
    const meta = ASPECT_META[type];
    const orb = Math.abs(delta - meta.angle);
    if (orb <= meta.orb) return { type, orb };
  }
  return null;
}

export function computeSynastry(a: NatalChart, b: NatalChart): SynastryResult {
  const aspects: SynastryAspect[] = [];
  let scored = 0;
  let max = 0;

  for (const pa of a.planets) {
    for (const pb of b.planets) {
      if (pa.id === "asc" && pb.id !== "asc" && !PERSONAL.includes(pb.id)) continue;
      const weight = pairWeight(pa.id, pb.id);
      max += weight;
      const delta = angleDelta(pa.longitude, pb.longitude);
      const hit = findAspect(delta);
      if (!hit) continue;
      const tightness = 1 - hit.orb / ASPECT_META[hit.type].orb;
      scored += weight * tightness * aspectHarmony(hit.type);
      aspects.push({
        a: pa.id,
        b: pb.id,
        type: hit.type,
        orb: Number(hit.orb.toFixed(2)),
        exactAngle: Number(delta.toFixed(2)),
      });
    }
  }

  const ratio = max > 0 ? scored / max : 0;
  const percent = Math.round(Math.min(99, Math.max(18, 28 + ratio * 95)));

  const hasNodalAspect = aspects.some((asp) => {
    const nodal = asp.a === "node" || asp.b === "node";
    const personal =
      PERSONAL.includes(asp.a) || PERSONAL.includes(asp.b);
    const contact = asp.type === "conjunction" || asp.type === "opposition";
    return nodal && personal && contact && asp.orb <= 6;
  });

  aspects.sort((x, y) => pairWeight(y.a, y.b) - pairWeight(x.a, x.b));

  return {
    percent,
    aspects: aspects.slice(0, 12),
    hasNodalAspect,
    hiloRojo: percent > 90 && hasNodalAspect,
  };
}
