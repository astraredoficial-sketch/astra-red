import { SIGNS, SIGN_GLYPHS, signFromLongitude } from "./constants";
import { computePlanetaryLongitudesAtUtc } from "./chart";
import { civilToUtc } from "./time";
import type { PlanetId } from "@/lib/types";

const DAILY_BODIES = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
] as const satisfies readonly PlanetId[];

const HOUSE_THEMES = [
  {
    name: "identidad e iniciativa",
    focus: "Es un buen día para volver a tu propio centro y elegir cómo quieres presentarte.",
    love: "La autenticidad acerca. Expresa lo que sientes sin intentar convertir cada diferencia en una prueba.",
    work: "Tu iniciativa puede abrir una conversación útil. Propón un primer paso concreto y escucha la respuesta.",
    wellbeing: "Haz una pausa antes de llenar el día de compromisos; tu energía también necesita espacio.",
    action: "Inicia algo pequeño que dependa de ti y dale atención antes de sumar otra tarea.",
  },
  {
    name: "recursos y prioridades",
    focus: "La atención se dirige a tus recursos, valores y a lo que merece tu tiempo.",
    love: "Un gesto sencillo y coherente puede decir más que una promesa. Conversen sobre lo que ambos valoran.",
    work: "Ordena gastos, materiales o pendientes antes de asumir algo nuevo. La claridad práctica te favorece.",
    wellbeing: "Busca una comodidad sencilla y sostenible: comer a tu ritmo, descansar o cuidar tu entorno.",
    action: "Elige una prioridad y reserva para ella un recurso concreto: tiempo, atención o presupuesto.",
  },
  {
    name: "ideas y conversaciones",
    focus: "Las ideas, el aprendizaje y las conversaciones cotidianas ganan protagonismo.",
    love: "Una pregunta hecha con curiosidad puede acercar posiciones. Deja espacio para escuchar sin preparar la respuesta.",
    work: "Escribe tus ideas y confirma los detalles antes de enviar o cerrar acuerdos.",
    wellbeing: "Descansa de la sobrecarga de información; no todo mensaje necesita respuesta inmediata.",
    action: "Aclara una duda pendiente con una pregunta directa y amable.",
  },
  {
    name: "hogar y mundo interior",
    focus: "El hogar, las raíces y la vida privada invitan a buscar una base más tranquila.",
    love: "La cercanía se construye con cuidado y seguridad emocional. Compartir un momento tranquilo puede bastar.",
    work: "Prepara un espacio o un horario que te permita trabajar con menos interrupciones.",
    wellbeing: "Atiende una necesidad básica que hayas postergado y permite que el descanso cuente como parte del día.",
    action: "Ordena un rincón o protege un momento para recuperar calma.",
  },
  {
    name: "creatividad y disfrute",
    focus: "La expresión personal, la creatividad y el disfrute pueden renovar tu perspectiva.",
    love: "El juego y la calidez suavizan la rutina. Comparte algo que te entusiasme sin exigir una reacción perfecta.",
    work: "Prueba una manera más creativa de presentar una idea, sin perder de vista lo que necesita resolverse.",
    wellbeing: "Reserva unos minutos para una actividad que disfrutes por sí misma, sin convertirla en otra meta.",
    action: "Haz espacio para crear, jugar o celebrar un avance, aunque sea pequeño.",
  },
  {
    name: "hábitos y tareas",
    focus: "Los hábitos y las tareas pequeñas muestran dónde un ajuste puede hacer el día más llevadero.",
    love: "La consideración cotidiana cuenta: acuerden quién hace qué y eviten esperar que la otra persona adivine.",
    work: "Divide una tarea grande en pasos verificables y deja un margen para imprevistos.",
    wellbeing: "Elige un hábito realista que te apoye hoy; no necesitas transformar toda tu rutina a la vez.",
    action: "Completa un pendiente concreto y decide cuál puede esperar.",
  },
  {
    name: "vínculos y acuerdos",
    focus: "Los vínculos y acuerdos invitan a equilibrar lo que das con lo que necesitas.",
    love: "Busca reciprocidad sin llevar una cuenta de favores. Un acuerdo explícito puede aliviar una expectativa confusa.",
    work: "Coordina responsabilidades y confirma qué espera cada persona antes de avanzar en conjunto.",
    wellbeing: "Pon un límite respetuoso si lo necesitas; cuidar tu energía también ayuda a cuidar los vínculos.",
    action: "Revisa un acuerdo importante y nombra con claridad qué necesitas de ambas partes.",
  },
  {
    name: "intimidad y transformación",
    focus: "La confianza, la intimidad y los recursos compartidos merecen atención cuidadosa.",
    love: "La honestidad puede fortalecer la confianza si llega con tacto. No tienes que resolverlo todo en una sola charla.",
    work: "Revisa responsabilidades o recursos compartidos y pide claridad cuando algo no esté definido.",
    wellbeing: "Permítete procesar lo que sientes en privado antes de decidir cómo comunicarlo.",
    action: "Aclara una preocupación de fondo con calma, paso a paso.",
  },
  {
    name: "aprendizaje y perspectiva",
    focus: "El aprendizaje y los nuevos puntos de vista pueden ampliar tu perspectiva.",
    love: "Compartir una curiosidad o una experiencia nueva puede dar aire al vínculo; mantén los pies en el presente.",
    work: "Investiga una alternativa antes de elegir. Distingue la posibilidad interesante del compromiso que sí puedes asumir.",
    wellbeing: "Un cambio de ritmo, una lectura o un paseo breve puede ayudarte a mirar el día con distancia.",
    action: "Explora una pregunta que te interese y anota qué descubriste.",
  },
  {
    name: "vocación y responsabilidades",
    focus: "Las responsabilidades y la dirección que estás construyendo ocupan el primer plano.",
    love: "Equilibra tus obligaciones con una muestra sincera de presencia para quienes te importan.",
    work: "Prioriza por impacto y define hasta dónde llega tu responsabilidad antes de aceptar más.",
    wellbeing: "Reconoce tus límites de tiempo y energía; avanzar también implica saber cuándo cerrar la jornada.",
    action: "Define un siguiente paso profesional que puedas completar sin descuidar lo esencial.",
  },
  {
    name: "amistades y proyectos colectivos",
    focus: "Las amistades, las redes y las metas compartidas pueden traer ideas valiosas.",
    love: "Una conversación entre amistades o en comunidad puede ayudarte a entender mejor lo que buscas en un vínculo.",
    work: "Pide una segunda opinión o comparte avances con el equipo; una colaboración clara puede destrabar una tarea.",
    wellbeing: "Busca compañía que te haga sentir en confianza, sin dejar que la agenda colectiva decida todo por ti.",
    action: "Contacta a alguien con quien compartas una idea y acuerden un paso realista.",
  },
  {
    name: "pausa y reflexión",
    focus: "Una pausa consciente puede ayudarte a cerrar pendientes emocionales y recuperar perspectiva.",
    love: "No completes los silencios con suposiciones. Date tiempo para reconocer lo que necesitas antes de hablar.",
    work: "Reserva un bloque sin interrupciones para cerrar, revisar o dejar una tarea lista para mañana.",
    wellbeing: "Baja el ritmo cuando puedas y busca una actividad restauradora que no te exija rendir.",
    action: "Deja ir una exigencia que no necesita resolverse hoy y protege un momento de descanso.",
  },
] as const;

export const ZODIAC_ELEMENTS = [
  "Fuego", "Tierra", "Aire", "Agua",
  "Fuego", "Tierra", "Aire", "Agua",
  "Fuego", "Tierra", "Aire", "Agua",
] as const;

const ELEMENT_COLORS = {
  Fuego: "Oro cálido",
  Tierra: "Verde salvia",
  Aire: "Lavanda",
  Agua: "Azul noche",
} as const;

const LUNAR_PHASES = [
  "Luna nueva",
  "Luna creciente",
  "Cuarto creciente",
  "Luna gibosa creciente",
  "Luna llena",
  "Luna gibosa menguante",
  "Cuarto menguante",
  "Luna menguante",
] as const;

const DAILY_PROSE_OPENERS = [
  "Hoy te puede servir",
  "La invitación de hoy es",
  "Una posibilidad para hoy es",
  "Tu punto de partida podría ser",
  "Vale la pena",
  "Prueba a",
  "Puedes comenzar por",
] as const;

const DAILY_PROSE_ACTIONS = [
  "escuchar lo que necesitas antes de responder",
  "darle un orden sencillo a una prioridad",
  "hacer una pausa antes de asumir un compromiso",
  "aclarar una expectativa con una pregunta directa",
  "dividir un pendiente en pasos que puedas completar",
  "reservar un momento sin interrupciones",
  "pedir la información que te falta para decidir",
  "reconocer un avance sin exigirte resolverlo todo",
  "revisar qué acuerdo necesita más claridad",
  "elegir una alternativa que puedas sostener",
  "expresar un límite con respeto",
] as const;

const DAILY_PROSE_CLOSINGS = [
  "No hace falta resolver todo hoy para avanzar.",
  "Una conversación clara puede cambiar cómo ves una situación.",
  "Avanzar con calma también es avanzar.",
  "Deja espacio para ajustar el plan si aparece información nueva.",
  "Elige un paso que dependa de ti.",
  "Tu atención es un recurso: úsala con intención.",
  "Puedes cambiar de estrategia sin abandonar lo que te importa.",
  "Reconoce lo que ya resolviste antes de añadir otra tarea.",
  "Una pausa breve puede ayudarte a mirar el asunto con perspectiva.",
  "Busca reciprocidad y claridad en los acuerdos.",
  "Dale prioridad a lo que sí puedes sostener hoy.",
  "Nombra con honestidad qué necesitas y qué puedes ofrecer.",
  "Cierra el día reconociendo una decisión consciente.",
] as const;

export interface DailyHoroscopeReading {
  sign: string;
  signIndex: number;
  glyph: string;
  element: (typeof ZODIAC_ELEMENTS)[number];
  focus: string;
  overview: string;
  love: string;
  work: string;
  wellbeing: string;
  action: string;
  luckyNumber: number;
  luckyColor: string;
  affirmation: string;
}

export interface DailyHoroscope {
  date: string;
  timeZone: string;
  calculatedAt: string;
  sky: {
    sunSign: string;
    moonSign: string;
    lunarPhase: (typeof LUNAR_PHASES)[number];
  };
  readings: DailyHoroscopeReading[];
}

function assertValidDateAndTimeZone(date: string, timeZone: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new RangeError("La fecha local debe tener el formato AAAA-MM-DD.");
  }
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new RangeError("La fecha local no es válida.");
  }
  if (!timeZone.trim()) {
    throw new RangeError("La zona horaria del visitante es obligatoria.");
  }
  try {
    new Intl.DateTimeFormat("es", { timeZone });
  } catch {
    throw new RangeError("La zona horaria del visitante no es válida.");
  }
}

function localDayAtNoon(date: string, timeZone: string): Date {
  return civilToUtc(date, "12:00", timeZone);
}

function houseFor(signIndex: number, transitSignIndex: number): number {
  return ((transitSignIndex - signIndex + 12) % 12) + 1;
}

function phaseFor(sunLongitude: number, moonLongitude: number) {
  const elongation = ((moonLongitude - sunLongitude) % 360 + 360) % 360;
  const phaseIndex = Math.floor(((elongation + 22.5) % 360) / 45);
  return LUNAR_PHASES[phaseIndex];
}

function dailyProseForSign(dayOrdinal: number, signIndex: number): string {
  // Coprime strides make each prose part advance on every successive date.
  const index = (day: number, step: number, length: number) =>
    ((day * step + signIndex) % length + length) % length;
  const opener =
    DAILY_PROSE_OPENERS[index(dayOrdinal, 1, DAILY_PROSE_OPENERS.length)];
  const action =
    DAILY_PROSE_ACTIONS[index(dayOrdinal, 5, DAILY_PROSE_ACTIONS.length)];
  const closing =
    DAILY_PROSE_CLOSINGS[index(dayOrdinal, 3, DAILY_PROSE_CLOSINGS.length)];

  return `${opener} ${action}. ${closing}`;
}

function readingForSign(
  date: string,
  dayOrdinal: number,
  signIndex: number,
  transitSigns: Record<(typeof DAILY_BODIES)[number], number>,
): DailyHoroscopeReading {
  const sunHouse = houseFor(signIndex, transitSigns.sun);
  const moonHouse = houseFor(signIndex, transitSigns.moon);
  const mercuryHouse = houseFor(signIndex, transitSigns.mercury);
  const venusHouse = houseFor(signIndex, transitSigns.venus);
  const marsHouse = houseFor(signIndex, transitSigns.mars);
  const focus = HOUSE_THEMES[sunHouse - 1];
  const moonTheme = HOUSE_THEMES[moonHouse - 1];
  const venusTheme = HOUSE_THEMES[venusHouse - 1];
  const mercuryTheme = HOUSE_THEMES[mercuryHouse - 1];
  const marsTheme = HOUSE_THEMES[marsHouse - 1];
  const dailyProse = dailyProseForSign(dayOrdinal, signIndex);
  const dateSeed = [...date.replaceAll("-", "")].reduce(
    (sum, digit) => sum + Number(digit),
    0,
  );
  const luckyNumber =
    ((dateSeed +
      signIndex * 17 +
      transitSigns.sun * 7 +
      transitSigns.moon * 11 +
      transitSigns.venus * 13 +
      transitSigns.mercury * 3) %
      90) +
    1;
  const element = ZODIAC_ELEMENTS[signIndex];

  return {
    sign: SIGNS[signIndex],
    signIndex,
    glyph: SIGN_GLYPHS[signIndex],
    element,
    focus: focus.name,
    overview: `${focus.focus} ${dailyProse}`,
    love: venusTheme.love,
    work: `${mercuryTheme.work} ${HOUSE_THEMES[houseFor(signIndex, transitSigns.saturn) - 1].work}`,
    wellbeing: moonTheme.wellbeing,
    action: marsTheme.action,
    luckyNumber,
    luckyColor: ELEMENT_COLORS[element],
    affirmation: `Hoy puedo avanzar con intención en ${focus.name}.`,
  };
}

export function getLocalCalendarDate(
  instant: Date,
  timeZone: string,
): string {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) {
    throw new RangeError("El instante local no es válido.");
  }
  if (!timeZone.trim()) {
    throw new RangeError("La zona horaria del visitante es obligatoria.");
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const values = Object.fromEntries(
    parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function calculateDailyHoroscope(
  date: string,
  timeZone: string,
): DailyHoroscope {
  assertValidDateAndTimeZone(date, timeZone);
  const dayOrdinal = Math.floor(
    Date.parse(`${date}T00:00:00.000Z`) / 86_400_000,
  );
  const calculatedAt = localDayAtNoon(date, timeZone);
  const longitudes = computePlanetaryLongitudesAtUtc(calculatedAt);
  const transitSigns = Object.fromEntries(
    DAILY_BODIES.map((body) => {
      const longitude = longitudes[body];
      if (typeof longitude !== "number" || !Number.isFinite(longitude)) {
        throw new Error(`No se pudo calcular la posición astral de ${body}.`);
      }
      return [body, signFromLongitude(longitude).signIndex];
    }),
  ) as Record<(typeof DAILY_BODIES)[number], number>;
  const sunLongitude = longitudes.sun;
  const moonLongitude = longitudes.moon;
  if (typeof sunLongitude !== "number" || typeof moonLongitude !== "number") {
    throw new Error("No se pudo calcular el cielo local para este día.");
  }

  return {
    date,
    timeZone,
    calculatedAt: calculatedAt.toISOString(),
    sky: {
      sunSign: SIGNS[transitSigns.sun],
      moonSign: SIGNS[transitSigns.moon],
      lunarPhase: phaseFor(sunLongitude, moonLongitude),
    },
    readings: SIGNS.map((_, signIndex) =>
      readingForSign(date, dayOrdinal, signIndex, transitSigns),
    ),
  };
}
