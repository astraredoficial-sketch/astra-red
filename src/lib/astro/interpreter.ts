import type { NatalChart, Placement, PlanetId } from "@/lib/types";
import { PLANET_META } from "@/lib/astro/constants";

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
  Aries: "la iniciativa y la respuesta directa",
  Tauro: "la estabilidad, los sentidos y la construcción",
  Géminis: "la curiosidad, el intercambio y la adaptación",
  Cáncer: "el cuidado, la memoria y la pertenencia",
  Leo: "la expresión, la creatividad y el reconocimiento",
  Virgo: "el análisis, la práctica y la organización",
  Libra: "el equilibrio, el diálogo y la cooperación",
  Escorpio: "la intensidad, la intimidad y la transformación",
  Sagitario: "la exploración, el aprendizaje y la libertad",
  Capricornio: "la responsabilidad, la constancia y las metas",
  Acuario: "la independencia, las ideas y lo colectivo",
  Piscis: "la sensibilidad, la imaginación y la compasión",
};

const planetTopics: Record<PlanetId, string> = {
  sun: "la identidad, la voluntad y la dirección personal",
  moon: "las necesidades emocionales, el cuidado y la seguridad",
  mercury: "el pensamiento, el aprendizaje y la comunicación",
  venus: "los vínculos, los valores y el disfrute",
  mars: "la iniciativa, el deseo y la respuesta ante los retos",
  jupiter: "las creencias, la búsqueda de sentido y la expansión",
  saturn: "los límites, la constancia y las responsabilidades",
  uranus: "la autonomía, los cambios y la innovación",
  neptune: "la imaginación, la sensibilidad y los ideales",
  pluto: "los procesos de cambio y el poder personal",
  node: "el crecimiento y las experiencias que amplían lo conocido",
  asc: "la primera impresión y la forma de iniciar experiencias",
};

const planetSubjects: Record<PlanetId, string> = {
  sun: "el Sol",
  moon: "la Luna",
  mercury: "Mercurio",
  venus: "Venus",
  mars: "Marte",
  jupiter: "Júpiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Neptuno",
  pluto: "Plutón",
  node: "el Nodo Norte",
  asc: "el Ascendente",
};

const houseTopics: Record<number, string> = {
  1: "la identidad y la manera de presentarte",
  2: "los recursos, valores y seguridad material",
  3: "el aprendizaje, la comunicación y el entorno cercano",
  4: "el hogar, las raíces y el sentido de pertenencia",
  5: "la creatividad, el juego y la expresión personal",
  6: "las rutinas, el cuidado cotidiano y el trabajo diario",
  7: "los acuerdos y las relaciones de colaboración",
  8: "la confianza, los recursos compartidos y los cambios",
  9: "el estudio, las creencias y la exploración",
  10: "las metas y el papel que deseas asumir en público",
  11: "las amistades, los grupos y los proyectos colectivos",
  12: "la introspección, el descanso y los procesos de cierre",
};

function interpretPlacement(
  placement: Placement,
  timeUnknown: boolean,
): PlanetReading {
  const title = planetTitles[placement.id];
  const signMeaning = signMeanings[placement.sign] ?? "un estilo singular";
  const houseMeaning = houseTopics[placement.house] ?? "un área personal";
  const houseContext = timeUnknown
    ? ""
    : `La casa ${placement.house} lleva este tema al ámbito de ${houseMeaning}.`;

  return {
    planet: placement.id,
    title,
    sign: placement.sign,
    house: placement.house,
    interpretation:
      `En astrología, ${planetSubjects[placement.id]} se asocia con ${planetTopics[placement.id]}. En ${placement.sign}, esa función se lee a través de ${signMeaning}. ${houseContext ? `${houseContext} ` : ""}Es una propuesta simbólica para reflexionar, no una descripción fija.`,
  };
}

export function generatePlanetReadings(chart: NatalChart): PlanetReading[] {
  return chart.planets.map((planet) =>
    interpretPlacement(planet, chart.timeUnknown),
  );
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
    const signMeaning = signMeanings[placement.sign] ?? "un estilo singular";
    const houseMeaning = houseTopics[placement.house] ?? "un área personal";
    const houseContext = chart.timeUnknown
      ? ""
      : ` En la casa ${placement.house}, se relaciona con ${houseMeaning}.`;
    return `${topic}: ${PLANET_META[planet].name} en ${placement.sign} combina ${planetTopics[planet]} con ${signMeaning}.${houseContext}`;
  };
  const sunMeaning = signMeanings[sun.sign] ?? "un estilo singular";
  const lines = [
    `Tu Sol en ${sun.sign} pone en primer plano la identidad y la dirección personal, con énfasis en ${sunMeaning}.${chart.timeUnknown ? "" : ` La casa ${sun.house} vincula este tema con ${houseTopics[sun.house] ?? "un área personal"}.`}`,
  ];

  if (!chart.timeUnknown) {
    const moonMeaning = signMeanings[moon.sign] ?? "un estilo singular";
    const ascMeaning = signMeanings[asc.sign] ?? "un estilo singular";
    lines.push(
      `Tu Luna en ${moon.sign} ofrece un lenguaje simbólico para explorar necesidades de cuidado y seguridad, con énfasis en ${moonMeaning}. La casa ${moon.house} sitúa el tema en ${houseTopics[moon.house] ?? "un área personal"}.`,
      `El Ascendente en ${asc.sign} describe simbólicamente la primera impresión y la forma de iniciar experiencias, con énfasis en ${ascMeaning}.`,
    );
  } else {
    lines.push(
      "Como no se indicó una hora fiable, no se interpretan las casas ni la Luna o el Ascendente; esas posiciones pueden variar con la hora.",
    );
  }

  lines.push(
    describe("mercury", "En comunicación"),
    describe("venus", "En vínculos y valores"),
    describe("mars", "En iniciativa"),
    "La astrología es un marco simbólico de reflexión; no determina tu personalidad ni predice hechos inevitables.",
  );

  return lines.filter(Boolean).join("\n\n");
}
