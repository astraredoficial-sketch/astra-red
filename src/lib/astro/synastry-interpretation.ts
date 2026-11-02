import type {
  AspectName,
  PlanetId,
  SynastryAspect,
  SynastryResult,
} from "@/lib/types";
import { ASPECT_META, PLANET_META } from "./constants";

export type SynastryInterpretationEvidence = {
  aspectIndex: number;
  planetA: PlanetId;
  planetB: PlanetId;
  planetAName: string;
  planetBName: string;
  aspect: AspectName;
  aspectName: string;
  orb: number;
  exactAngle: number;
  orbDescription: string;
  interpretation: string;
};

export type SynastryInterpretationSection = {
  id: string;
  title: string;
  summary: string;
  evidence: SynastryInterpretationEvidence[];
};

export type SynastryInterpretationReport = {
  sections: SynastryInterpretationSection[];
  conclusion: string;
  notes: string[];
  hasChartData: boolean;
  counts: {
    total: number;
    harmonious: number;
    tense: number;
    conjunctions: number;
  };
};

type IndexedAspect = {
  aspect: SynastryAspect;
  aspectIndex: number;
};

const SAME_PLANET_COMMON = new Set<PlanetId>([
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
]);

const OUTER_AND_GROWTH = new Set<PlanetId>([
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "node",
]);

function contains(
  aspect: SynastryAspect,
  planet: PlanetId,
): boolean {
  return aspect.a === planet || aspect.b === planet;
}

function hasPair(
  aspect: SynastryAspect,
  first: PlanetId,
  second: PlanetId,
): boolean {
  return (
    (aspect.a === first && aspect.b === second) ||
    (aspect.a === second && aspect.b === first)
  );
}

function pairTopic(aspect: SynastryAspect): string {
  const a = aspect.a;
  const b = aspect.b;

  if (hasPair(aspect, "sun", "moon")) {
    return "la relación entre la expresión de identidad de una persona y las necesidades emocionales de la otra";
  }

  if (hasPair(aspect, "venus", "mars")) {
    return "la interacción entre afecto, atracción, iniciativa y deseo";
  }

  if (a === b && a === "sun") {
    return "la afinidad o diferencia entre sus formas de expresar identidad, voluntad y vitalidad";
  }

  if (a === b && a === "moon") {
    return "la relación entre sus necesidades emocionales y sus formas de buscar seguridad";
  }

  if (a === b && a === "venus") {
    return "la relación entre sus preferencias afectivas, valores y maneras de expresar cariño";
  }

  if (a === b && a === "mars") {
    return "la relación entre sus impulsos, iniciativas y maneras de actuar";
  }

  if (a === b && a === "mercury") {
    return "la afinidad o diferencia entre sus estilos de pensamiento y comunicación";
  }

  if (contains(aspect, "mercury")) {
    return "el intercambio de ideas, la comunicación y la manera de procesar información";
  }

  if (contains(aspect, "saturn")) {
    return "la responsabilidad, los límites, la constancia y la construcción de acuerdos";
  }

  if (contains(aspect, "node")) {
    return "una conexión simbólica con procesos de aprendizaje y dirección personal, sin que esto implique destino predeterminado";
  }

  if (contains(aspect, "jupiter")) {
    return "la expansión de perspectivas, creencias, proyectos y oportunidades de aprendizaje";
  }

  if (contains(aspect, "uranus")) {
    return "la autonomía, los cambios, la originalidad y la necesidad de espacio";
  }

  if (contains(aspect, "neptune")) {
    return "la imaginación, la sensibilidad y la posibilidad de idealización";
  }

  if (contains(aspect, "pluto")) {
    return "la intensidad, la transformación y la manera de gestionar el poder personal";
  }

  if (contains(aspect, "moon")) {
    return "la sensibilidad y las necesidades de seguridad emocional";
  }

  if (contains(aspect, "venus")) {
    return "el afecto, los valores y las preferencias en los vínculos";
  }

  if (contains(aspect, "mars")) {
    return "la iniciativa, la energía y la manera de afrontar acciones";
  }

  if (contains(aspect, "sun")) {
    return "la identidad, la voluntad y la expresión personal";
  }

  return "la interacción simbólica entre estas dos funciones planetarias";
}

function aspectMeaning(type: AspectName): string {
  switch (type) {
    case "conjunction":
      return "La conjunción concentra ambas funciones en una misma zona de interacción; puede intensificar su expresión, sin ser necesariamente armónica o conflictiva.";

    case "sextile":
      return "El sextil señala una oportunidad de cooperación y apertura; su potencial suele requerir participación consciente.";

    case "square":
      return "La cuadratura señala fricción o exigencia de ajuste; puede hacer visibles diferencias que necesitan negociación.";

    case "trine":
      return "El trígono sugiere fluidez y facilidad de intercambio; esa facilidad no garantiza por sí sola que el potencial se aproveche.";

    case "opposition":
      return "La oposición pone en relación dos polos distintos; puede favorecer complementariedad, aunque también exige equilibrio y negociación.";
  }
}

function describeOrb(
  type: AspectName,
  orb: number,
): string {
  const maximum = ASPECT_META[type].orb;
  const ratio = maximum > 0 ? orb / maximum : 1;

  if (ratio <= 0.25) return "muy estrecho dentro del orbe admitido";
  if (ratio <= 0.6) return "estrecho dentro del orbe admitido";
  return "amplio dentro del orbe admitido";
}

function createEvidence(
  item: IndexedAspect,
): SynastryInterpretationEvidence {
  const { aspect, aspectIndex } = item;
  const planetAName = PLANET_META[aspect.a].name;
  const planetBName = PLANET_META[aspect.b].name;

  return {
    aspectIndex,
    planetA: aspect.a,
    planetB: aspect.b,
    planetAName,
    planetBName,
    aspect: aspect.type,
    aspectName: ASPECT_META[aspect.type].name,
    orb: aspect.orb,
    exactAngle: aspect.exactAngle,
    orbDescription: describeOrb(aspect.type, aspect.orb),
    interpretation:
      `${aspectMeaning(aspect.type)} ` +
      `Simbólicamente, este contacto relaciona ${pairTopic(aspect)}.`,
  };
}

function makeSection(
  id: string,
  title: string,
  summary: string,
  items: IndexedAspect[],
): SynastryInterpretationSection | null {
  if (items.length === 0) return null;

  return {
    id,
    title,
    summary,
    evidence: items.map(createEvidence),
  };
}

function conclusionText(
  total: number,
  harmonious: number,
  tense: number,
  conjunctions: number,
): string {
  if (total === 0) {
    return "No hay aspectos cruzados registrados para esta sinastría. " +
      "Con la información disponible no es posible formular una interpretación " +
      "de compatibilidad basada en aspectos.";
  }

  return (
    `El cálculo conserva ${total} aspectos cruzados registrados. ` +
    `De ellos, ${harmonious} corresponden a trígonos o sextiles; ` +
    `${tense} a cuadraturas u oposiciones; y ${conjunctions} a conjunciones. ` +
    "Estas categorías describen dinámicas simbólicas diferentes y deben " +
    "interpretarse en conjunto. Ninguna categoría determina por sí sola " +
    "la calidad, estabilidad o futuro de una relación."
  );
}

export function buildSynastryInterpretation(
  result: SynastryResult,
): SynastryInterpretationReport {
  const indexed: IndexedAspect[] = result.aspects
    .map((aspect, aspectIndex) => ({ aspect, aspectIndex }))
    .filter(({ aspect }) => {
      // El Ascendente no se interpreta en este catálogo.
      if (aspect.a === "asc" || aspect.b === "asc") return false;

      // Si cualquiera de las horas es desconocida, no se interpreta la Luna.
      if (
        result.timeApproximate &&
        (aspect.a === "moon" || aspect.b === "moon")
      ) {
        return false;
      }

      return true;
    });

  const sectionDefinitions = [
    {
      id: "common",
      title: "Funciones planetarias compartidas",
      summary: "Contactos del mismo planeta entre ambas cartas.",
    },
    {
      id: "communication",
      title: "Comunicación",
      summary: "Contactos de Mercurio, asociados simbólicamente al intercambio de ideas.",
    },
    {
      id: "emotional",
      title: "Dinámica emocional",
      summary: "Contactos de la Luna, interpretados con cautela como temas de sensibilidad.",
    },
    {
      id: "attraction",
      title: "Afecto e iniciativa",
      summary: "Contactos de Venus o Marte, relacionados simbólicamente con afecto e iniciativa.",
    },
    {
      id: "essence",
      title: "Identidad y expresión",
      summary: "Contactos del Sol, asociados a identidad y expresión personal.",
    },
    {
      id: "growth",
      title: "Aprendizaje y cambio",
      summary: "Contactos de planetas exteriores o del Nodo Norte.",
    },
  ] as const;

  const grouped = new Map<string, IndexedAspect[]>(
    sectionDefinitions.map(({ id }) => [id, []]),
  );

  for (const item of indexed) {
    const { aspect } = item;
    const sectionId =
      aspect.a === aspect.b && SAME_PLANET_COMMON.has(aspect.a)
        ? "common"
        : contains(aspect, "mercury")
          ? "communication"
          : contains(aspect, "moon")
            ? "emotional"
            : contains(aspect, "venus") || contains(aspect, "mars")
              ? "attraction"
              : contains(aspect, "sun")
                ? "essence"
                : OUTER_AND_GROWTH.has(aspect.a) ||
                    OUTER_AND_GROWTH.has(aspect.b)
                  ? "growth"
                  : null;

    if (sectionId) grouped.get(sectionId)?.push(item);
  }

  const harmonious = indexed.filter(({ aspect }) =>
    aspect.type === "trine" || aspect.type === "sextile",
  );

  const tense = indexed.filter(({ aspect }) =>
    aspect.type === "square" || aspect.type === "opposition",
  );

  const sections = sectionDefinitions
    .map(({ id, title, summary }) =>
      makeSection(id, title, summary, grouped.get(id) ?? []),
    )
    .filter(
      (section): section is SynastryInterpretationSection => section !== null,
    );

  const conjunctions = indexed.filter(
    ({ aspect }) => aspect.type === "conjunction",
  ).length;

  const notes: string[] = [];

  if (!result.charts) {
    notes.push(
      "Este registro histórico no conserva las cartas natales originales. " +
      "La interpretación se limita a los aspectos que quedaron guardados; " +
      "no se reconstruyen signos, posiciones ni casas ausentes.",
    );
  }

  if (result.timeApproximate) {
    notes.push(
      "Al menos una hora de nacimiento es desconocida. " +
      "Por rigor, este informe no interpreta contactos de Luna ni Ascendente.",
    );
  }

  if (result.aspects.some((aspect) => aspect.a === "asc" || aspect.b === "asc")) {
    notes.push(
      "Los contactos del Ascendente se conservan en los aspectos registrados, " +
        "pero no se interpretan en secciones temáticas.",
    );
  }

  return {
    sections,
    conclusion: conclusionText(
      indexed.length,
      harmonious.length,
      tense.length,
      conjunctions,
    ),
    notes,
    hasChartData: Boolean(result.charts),
    counts: {
      total: indexed.length,
      harmonious: harmonious.length,
      tense: tense.length,
      conjunctions,
    },
  };
}