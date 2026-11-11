import * as Astronomy from "astronomy-engine";
import type { BirthData, NatalChart, PlanetId } from "@/lib/types";
import {
  computeNatalChartAtUtc,
  computePlanetaryLongitudesAtUtc,
} from "./chart";
import { signFromLongitude } from "./constants";
import { civilToUtcCandidates } from "./time";

export const SOLAR_RETURN_METHODOLOGY_VERSION =
  "astronomy-engine-apparent-sun-longitude-v1";

export interface SolarReturnInput {
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  cityId: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  city: string;
  country: string;
}

export interface SolarReturnReading {
  id: "cycle" | "relationships" | "work-resources" | "wellbeing" | "growth";
  title: string;
  text: string;
  reflection: string;
}

export interface SolarReturnResult {
  year: number;
  returnAtUtc: string;
  natalSunLongitude: number;
  chart: NatalChart;
  approximate: boolean;
  location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    timeZone: string;
  };
  methodologyVersion: typeof SOLAR_RETURN_METHODOLOGY_VERSION;
  readings: SolarReturnReading[];
}

const HOUSE_TOPICS = [
  "identidad e iniciativas personales",
  "recursos, valores y prioridades",
  "comunicación, aprendizaje y entorno cercano",
  "hogar, raíces y vida privada",
  "creatividad, expresión y disfrute",
  "rutinas, tareas y habilidades cotidianas",
  "vínculos, acuerdos y colaboración",
  "intimidad y recursos compartidos",
  "estudios, viajes y ampliación de perspectiva",
  "vocación, responsabilidades y dirección pública",
  "amistades, redes y proyectos colectivos",
  "pausas, cierres y reflexión interior",
] as const;

const SIGN_TONES: Record<string, string> = {
  Aries: "iniciativa y acción directa",
  Tauro: "estabilidad y construcción paciente",
  Géminis: "curiosidad e intercambio de ideas",
  Cáncer: "cuidado y sentido de pertenencia",
  Leo: "expresión creativa y confianza",
  Virgo: "observación y atención al detalle",
  Libra: "cooperación y búsqueda de equilibrio",
  Escorpio: "profundidad y transformación",
  Sagitario: "exploración y amplitud de perspectiva",
  Capricornio: "estructura y responsabilidad",
  Acuario: "independencia e innovación",
  Piscis: "imaginación y sensibilidad",
};

function assertValidInput(input: SolarReturnInput, year: number): void {
  if (!Number.isInteger(year) || year < 1900 || year > 2200) {
    throw new RangeError("El año debe estar entre 1900 y 2200.");
  }
  if (
    !Number.isFinite(input.latitude) ||
    input.latitude < -90 ||
    input.latitude > 90 ||
    !Number.isFinite(input.longitude) ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    throw new RangeError("Las coordenadas geográficas no son válidas.");
  }
  if (!input.timeZone.trim()) {
    throw new RangeError("La zona horaria natal es obligatoria.");
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: input.timeZone });
  } catch {
    throw new RangeError("La zona horaria natal debe ser una zona IANA válida.");
  }
  if (!input.birthTimeUnknown && !input.birthTime) {
    throw new RangeError(
      "Falta la hora de nacimiento. Regístrala o indica que es desconocida.",
    );
  }
}

function placement(chart: NatalChart, id: PlanetId) {
  const found = chart.planets.find((planet) => planet.id === id);
  if (!found) throw new Error(`No se encontró la posición de ${id}.`);
  return found;
}

function houseTopic(house: number): string {
  return HOUSE_TOPICS[house - 1] ?? "distintos ámbitos de la vida";
}

function createReadings(chart: NatalChart): SolarReturnReading[] {
  const sun = placement(chart, "sun");
  const moon = placement(chart, "moon");
  const venus = placement(chart, "venus");
  const jupiter = placement(chart, "jupiter");
  const secondHouse = signFromLongitude(chart.houses[1]).sign;
  const tenthHouse = signFromLongitude(chart.houses[9]).sign;
  const tenthTone = SIGN_TONES[tenthHouse] ?? "un estilo propio";
  const secondTone = SIGN_TONES[secondHouse] ?? "un estilo propio";

  return [
    {
      id: "cycle",
      title: "Dirección del ciclo",
      text: `El Sol en ${sun.sign}, casa ${sun.house}, pone el foco simbólico en ${houseTopic(sun.house)}. Esta carta sirve como marco de reflexión para el período que comienza alrededor del retorno.`,
      reflection: "¿Qué intención concreta quieres priorizar en este ámbito?",
    },
    {
      id: "relationships",
      title: "Vínculos y afectos",
      text: `Venus en ${venus.sign}, casa ${venus.house}, relaciona los vínculos y acuerdos con ${houseTopic(venus.house)}. El matiz simbólico de ${venus.sign} se asocia con ${SIGN_TONES[venus.sign] ?? "una forma personal de relacionarse"}.`,
      reflection: "¿Qué conversación o acuerdo merece más cuidado este año?",
    },
    {
      id: "work-resources",
      title: "Trabajo y recursos",
      text: `La cúspide de la casa 10 en ${tenthHouse} destaca ${houseTopic(10)} con un matiz de ${tenthTone}. La casa 2 comienza en ${secondHouse}, asociada aquí con ${secondTone} al reflexionar sobre recursos y prioridades. No implica resultados profesionales ni económicos garantizados.`,
      reflection: "¿Qué responsabilidad y qué recurso te gustaría organizar mejor?",
    },
    {
      id: "wellbeing",
      title: "Ritmo y bienestar cotidiano",
      text: `La Luna en ${moon.sign}, casa ${moon.house}, señala simbólicamente ${houseTopic(moon.house)} como un contexto emocional relevante. Puede servir para revisar hábitos y límites; no es una evaluación ni una recomendación médica.`,
      reflection: "¿Qué hábito cotidiano te ayuda a sostener un ritmo más amable?",
    },
    {
      id: "growth",
      title: "Exploración y oportunidades",
      text: `Júpiter en ${jupiter.sign}, casa ${jupiter.house}, invita a explorar ${houseTopic(jupiter.house)}. Se trata de una lectura simbólica, no de una predicción ni una promesa de oportunidades.`,
      reflection: "¿Qué posibilidad puedes explorar con curiosidad y criterio?",
    },
  ];
}

export function calculateSolarReturn(
  input: SolarReturnInput,
  year: number,
): SolarReturnResult {
  assertValidInput(input, year);
  const birthTime = input.birthTimeUnknown ? "12:00" : input.birthTime!;
  const birthInstants = civilToUtcCandidates(
    input.birthDate,
    birthTime.slice(0, 5),
    input.timeZone,
  );
  if (birthInstants.length > 1) {
    throw new RangeError(
      "La hora natal ocurrió dos veces por un cambio horario y no permite elegir un instante único.",
    );
  }

  const natalLongitudes = computePlanetaryLongitudesAtUtc(birthInstants[0]);
  const natalSunLongitude = natalLongitudes.sun;
  if (typeof natalSunLongitude !== "number") {
    throw new Error("No se pudo calcular la longitud natal del Sol.");
  }

  const [, monthText, dayText] = input.birthDate.split("-");
  const month = Number(monthText);
  const day = Number(dayText);
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const anniversaryDay = Math.min(day, lastDayOfMonth);
  const searchStart = new Date(Date.UTC(year, month - 1, anniversaryDay - 4));
  const returnTime = Astronomy.SearchSunLongitude(
    natalSunLongitude,
    searchStart,
    10,
  );
  if (!returnTime) {
    throw new Error(
      "No se encontró el retorno solar dentro del intervalo de búsqueda.",
    );
  }

  const birth: BirthData = {
    date: input.birthDate,
    time: birthTime.slice(0, 5),
    cityId: input.cityId,
    timeUnknown: false,
    location: {
      latitude: input.latitude,
      longitude: input.longitude,
      timeZone: input.timeZone,
    },
  };
  const chart = computeNatalChartAtUtc(birth, returnTime.date);

  return {
    year,
    returnAtUtc: returnTime.date.toISOString(),
    natalSunLongitude,
    chart,
    approximate: input.birthTimeUnknown,
    location: {
      city: input.city,
      country: input.country,
      latitude: input.latitude,
      longitude: input.longitude,
      timeZone: input.timeZone,
    },
    methodologyVersion: SOLAR_RETURN_METHODOLOGY_VERSION,
    readings: createReadings(chart),
  };
}
