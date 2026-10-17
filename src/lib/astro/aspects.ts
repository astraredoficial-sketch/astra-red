import { angleDelta, ASPECT_META } from "./constants";
import type { AspectName, NatalChart, PlanetId } from "@/lib/types";

export type NatalAspect = {
  a: PlanetId;
  b: PlanetId;
  type: AspectName;
  separation: number;
  orb: number;
};

export function formatArcMinutes(degrees: number): string {
  const totalMinutes = Math.round(degrees * 60);
  const wholeDegrees = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${wholeDegrees}°${String(minutes).padStart(2, "0")}′`;
}

export function describeAspect(type: AspectName): string {
  switch (type) {
    case "conjunction":
      return "En esta lectura simbólica, ambos temas se expresan de forma cercana o combinada.";
    case "sextile":
      return "Se interpreta como una oportunidad de cooperación que puede desarrollarse con intención.";
    case "square":
      return "Se lee como una fricción entre temas que puede invitar a buscar ajustes.";
    case "trine":
      return "Se asocia con fluidez entre temas; no garantiza un resultado favorable.";
    case "opposition":
      return "Pone en diálogo dos polos y puede invitar a integrar necesidades distintas.";
  }
}

export function getNatalAspects(chart: NatalChart): NatalAspect[] {
  const aspects: NatalAspect[] = [];
  const planets = chart.timeUnknown
    ? chart.planets.filter(
        (planet) => planet.id !== "moon" && planet.id !== "asc",
      )
    : chart.planets;

  for (let i = 0; i < planets.length; i += 1) {
    const first = planets[i];
    for (const second of planets.slice(i + 1)) {
      const separation = angleDelta(first.longitude, second.longitude);
      const match = (Object.keys(ASPECT_META) as AspectName[])
        .map((type) => ({
          type,
          orb: Math.abs(separation - ASPECT_META[type].angle),
        }))
        .find(({ type, orb }) => orb <= ASPECT_META[type].orb);

      if (!match) continue;
      aspects.push({
        a: first.id,
        b: second.id,
        type: match.type,
        separation,
        orb: match.orb,
      });
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb);
}
