import type { NatalChart, Placement, PlanetId } from "@/lib/types";

export interface PlanetReading {
  planet: PlanetId;
  title: string;
  sign: string;
  house: number;
  interpretation: string;
}

const planetTitles: Record<PlanetId, string> = {
  sun: "Tu esencia e identidad",
  moon: "Tu mundo emocional",
  mercury: "Tu mente y comunicación",
  venus: "Tu forma de amar",
  mars: "Tu energía y deseo",
  jupiter: "Tu expansión y crecimiento",
  saturn: "Tus aprendizajes y disciplina",
  uranus: "Tu cambio e innovación",
  neptune: "Tu sensibilidad e intuición",
  pluto: "Tu transformación personal",
  node: "Tu camino de evolución",
  asc: "La energía que proyectas al mundo",
};

const signMeanings: Record<string, string> = {
  Aries: "una energía directa, valiente y de iniciativa.",
  Tauro: "una energía estable, sensorial y orientada a construir.",
  Géminis: "una energía curiosa, comunicativa y adaptable.",
  Cáncer: "una energía emocional, protectora y profunda.",
  Leo: "una energía creativa, expresiva y luminosa.",
  Virgo: "una energía analítica, práctica y perfeccionista.",
  Libra: "una energía que busca equilibrio, belleza y conexión.",
  Escorpio: "una energía intensa, transformadora y profunda.",
  Sagitario: "una energía expansiva, libre y exploradora.",
  Capricornio: "una energía responsable, ambiciosa y perseverante.",
  Acuario: "una energía independiente, original y visionaria.",
  Piscis: "una energía sensible, intuitiva y espiritual.",
};

function interpretPlacement(placement: Placement): PlanetReading {
  const title = planetTitles[placement.id];

  const signMeaning =
    signMeanings[placement.sign] ??
    "una energía única dentro de tu mapa personal.";

  return {
    planet: placement.id,
    title,
    sign: placement.sign,
    house: placement.house,
    interpretation:
      `${title}. ${placement.id.toUpperCase()} en ${placement.sign} representa ${signMeaning} Se expresa especialmente en la casa ${placement.house}.`,
  };
}

export function generatePlanetReadings(chart: NatalChart): PlanetReading[] {
  return chart.planets.map((planet) => interpretPlacement(planet));
}

export function generateLifeSummary(chart: NatalChart): string {
  const sun = chart.triad.sun;
  const moon = chart.triad.moon;
  const asc = chart.triad.asc;
  const placementFor = (planet: PlanetId) =>
    chart.planets.find((item) => item.id === planet);
  const describe = (planet: PlanetId, topic: string) => {
    const placement = placementFor(planet);
    if (!placement) return "";
    const meaning =
      signMeanings[placement.sign] ??
      "una energía singular dentro de tu mapa personal.";
    return `${topic}: ${placement.sign} trae ${meaning} Esta área se expresa especialmente en la casa ${placement.house}.`;
  };

  return [
    `Identidad y dirección: tu Sol en ${sun.sign} representa ${signMeanings[sun.sign] ?? "una energía singular dentro de tu mapa personal."} La casa ${sun.house} señala el ámbito donde esta esencia busca expresarse.`,
    `Necesidades emocionales: tu Luna en ${moon.sign} representa ${signMeanings[moon.sign] ?? "una energía singular dentro de tu mapa personal."} La casa ${moon.house} describe dónde tiendes a buscar pertenencia y seguridad.`,
    `Primera impresión: el Ascendente en ${asc.sign} representa ${signMeanings[asc.sign] ?? "una energía singular dentro de tu mapa personal."} Es la forma inicial en que te acercas a entornos y vínculos nuevos.`,
    describe("mercury", "Comunicación y aprendizaje"),
    describe("venus", "Afecto y relaciones"),
    describe("mars", "Iniciativa y energía"),
    describe("jupiter", "Expansión y oportunidades"),
    describe("saturn", "Responsabilidad y aprendizajes"),
    describe("node", "Dirección de crecimiento"),
    "La astrología ofrece un marco simbólico de reflexión; no determina tu personalidad ni predice hechos inevitables.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
