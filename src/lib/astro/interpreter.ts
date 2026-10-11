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

  return (
    `Tu carta revela tu esencia con el Sol en ${sun.sign}, ` +
    `tu mundo emocional con la Luna en ${moon.sign}, ` +
    `y la energía que proyectas mediante un Ascendente en ${asc.sign}. ` +
    `Esta combinación representa una historia personal única.`
  );
}
