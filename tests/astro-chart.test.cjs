const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

require.extensions[".ts"] = function (module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  module._compile(compiled.outputText, filename);
};

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    request = path.join(process.cwd(), "src", request.slice(2));
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const {
  computeNatalChart,
  computeNatalChartAtUtc,
} = require("../src/lib/astro/chart.ts");
const { getNatalAspects, formatArcMinutes } = require("../src/lib/astro/aspects.ts");
const { formatDegree, roundedPosition } = require("../src/lib/astro/constants.ts");
const { computeSynastry } = require("../src/lib/astro/synastry.ts");
const { createSynastryPdf } = require("../src/lib/astro/synastry-pdf.ts");
const { compatibilityPercent } = require("../supabase/functions/_shared/synastry.ts");
const { civilToUtc } = require("../src/lib/astro/time.ts");
const { isAtLeastAge } = require("../src/lib/age.ts");
const { GET: getLocations } = require("../src/app/api/locations/route.ts");

const birth = {
  date: "2000-01-01",
  time: "12:00",
  cityId: "us-nyc",
  timeUnknown: false,
};

test("la carta natal contiene los doce puntos esperados", () => {
  const chart = computeNatalChart(birth);
  const expected = [
    "sun", "moon", "mercury", "venus", "mars", "jupiter",
    "saturn", "uranus", "neptune", "pluto", "node", "asc",
  ];

  assert.equal(chart.planets.length, 12);
  assert.deepEqual(
    chart.planets.map((planet) => planet.id).sort(),
    expected.sort(),
  );
});

test("las longitudes, los signos, los grados y las casas están dentro de rango", () => {
  const chart = computeNatalChart(birth);

  for (const planet of chart.planets) {
    assert.ok(Number.isFinite(planet.longitude), `${planet.id}: longitud no finita`);
    assert.ok(planet.longitude >= 0 && planet.longitude < 360, `${planet.id}: longitud fuera de rango`);
    assert.ok(Number.isInteger(planet.signIndex) && planet.signIndex >= 0 && planet.signIndex < 12);
    assert.ok(planet.degreeInSign >= 0 && planet.degreeInSign < 30);
    assert.ok(Number.isInteger(planet.house) && planet.house >= 1 && planet.house <= 12);
  }
});

test("los aspectos natales detectan conjunciones cruzando 0 grados", () => {
  const aspects = getNatalAspects({
    planets: [
      { id: "sun", longitude: 359 },
      { id: "moon", longitude: 2 },
    ],
    timeUnknown: false,
  });

  assert.deepEqual(aspects, [
    {
      a: "sun",
      b: "moon",
      type: "conjunction",
      separation: 3,
      orb: 3,
    },
  ]);
});

test("los aspectos respetan los orbes máximos y se ordenan por exactitud", () => {
  const included = getNatalAspects({
    planets: [
      { id: "sun", longitude: 0 },
      { id: "moon", longitude: 66 },
      { id: "mercury", longitude: 66.001 },
    ],
    timeUnknown: false,
  });

  assert.equal(included.length, 2);
  assert.equal(included[0].a, "moon");
  assert.equal(included[0].b, "mercury");
  assert.ok(Math.abs(included[0].orb - 0.001) < 1e-9);
  assert.equal(included[1].a, "sun");
  assert.equal(included[1].b, "moon");
  assert.equal(included[1].orb, 6);
  assert.equal(included.some(({ a, b }) => a === "sun" && b === "mercury"), false);
});

test("se omiten los aspectos de Luna y Ascendente cuando la hora es desconocida", () => {
  const aspects = getNatalAspects({
    planets: [
      { id: "sun", longitude: 0 },
      { id: "moon", longitude: 60 },
      { id: "asc", longitude: 1 },
      { id: "mercury", longitude: 120 },
    ],
    timeUnknown: true,
  });

  assert.ok(aspects.length > 0);
  assert.ok(
    aspects.every(
      ({ a, b }) => a !== "moon" && b !== "moon" && a !== "asc" && b !== "asc",
    ),
  );
});

test("los grados y orbes se muestran en grados y minutos sin minutos inválidos", () => {
  assert.equal(formatDegree(1.9999), "2°00′");
  assert.equal(formatArcMinutes(1.25), "1°15′");
  assert.deepEqual(roundedPosition(29 + 59.6 / 60), {
    sign: "Tauro",
    signIndex: 1,
    degreeInSign: 0,
  });
  assert.deepEqual(roundedPosition(359 + 59.6 / 60), {
    sign: "Aries",
    signIndex: 0,
    degreeInSign: 0,
  });
});

test("la carta usa Placidus y conserva los ejes opuestos de las casas", () => {
  const chart = computeNatalChart(birth);

  assert.equal(chart.houseSystem, "placidus");
  assert.equal(chart.houses.length, 12);
  assert.ok(Math.abs(chart.houses[0] - chart.triad.asc.longitude) < 1e-8);

  for (let i = 0; i < 6; i++) {
    const opposite = chart.houses[i + 6];
    const distance = (opposite - chart.houses[i] + 360) % 360;
    assert.ok(Math.abs(distance - 180) < 1e-8, `Eje incorrecto en la casa ${i + 1}`);
  }
  assert.ok(
    chart.houses.some((cusp, index) => {
      const next = chart.houses[(index + 1) % 12];
      const distance = (next - cusp + 360) % 360;
      return Math.abs(distance - 30) > 1e-5;
    }),
    "Placidus no debe forzar doce casas de treinta grados",
  );
});

test("la tríada coincide con los planetas correspondientes", () => {
  const chart = computeNatalChart(birth);

  for (const id of ["sun", "moon", "asc"]) {
    const planet = chart.planets.find((item) => item.id === id);
    assert.ok(planet, `Falta ${id} en la lista de puntos`);
    assert.deepEqual(chart.triad[id], planet);
  }

  assert.equal("julianDay" in chart, false);
});

test("la compatibilidad puede alcanzar el 100 por ciento", () => {
  const chart = computeNatalChart(birth);
  const alignedChart = {
    ...chart,
    planets: chart.planets.map((planet) => ({ ...planet, longitude: 180 })),
  };

  assert.equal(computeSynastry(alignedChart, alignedChart).percent, 100);
});

test("el cálculo de compatibilidad para avisos coincide con la sinastría de la app", () => {
  const first = computeNatalChart(birth);
  const second = computeNatalChart({
    ...birth,
    date: "1997-07-17",
    time: "09:30",
  });

  assert.equal(
    compatibilityPercent(first, second),
    computeSynastry(first, second).percent,
  );
  assert.equal(
    compatibilityPercent(first, first),
    computeSynastry(first, first).percent,
  );
  assert.equal(compatibilityPercent({}, second), null);
});

test("la edad mínima de 18 años se valida en la fecha exacta del cumpleaños", () => {
  const referenceDate = new Date(2026, 5, 22);

  assert.equal(isAtLeastAge("2008-06-22", 18, referenceDate), true);
  assert.equal(isAtLeastAge("2008-06-23", 18, referenceDate), false);
  assert.equal(isAtLeastAge("2000-01-01", 18, referenceDate), true);
});

test("el control de edad rechaza fechas futuras o inválidas", () => {
  const referenceDate = new Date(2026, 5, 22);

  assert.equal(isAtLeastAge("2027-01-01", 18, referenceDate), false);
  assert.equal(isAtLeastAge("2008-02-30", 18, referenceDate), false);
  assert.equal(isAtLeastAge("", 18, referenceDate), false);
});

test("el cumpleaños del 29 de febrero alcanza la mayoría de edad el 28 de febrero no bisiesto", () => {
  assert.equal(
    isAtLeastAge("2008-02-29", 18, new Date(2026, 1, 28)),
    true,
  );
});

test("una hora natal desconocida excluye aspectos de Ascendente", () => {
  const knownChart = computeNatalChart(birth);
  const unknownChart = computeNatalChart({ ...birth, timeUnknown: true });
  const result = computeSynastry(unknownChart, knownChart);

  assert.equal(result.timeApproximate, true);
  assert.ok(
    result.aspects.every(
      (aspect) =>
        aspect.a !== "asc" &&
        aspect.b !== "asc" &&
        aspect.a !== "moon" &&
        aspect.b !== "moon",
    ),
  );
  assert.equal(
    result.percent,
    computeSynastry(knownChart, unknownChart).percent,
  );
});

test("la sinastría registra el tipo, orbe y separación angulares exactos en los límites admitidos", () => {
  const base = computeNatalChart(birth);
  const singlePlanetChart = (id, longitude) => ({
    ...base,
    planets: [{ id, longitude }],
  });
  const cases = [
    { type: "conjunction", angle: 8, outside: 8.01, orb: 8 },
    { type: "sextile", angle: 66, outside: 66.01, orb: 6 },
    { type: "square", angle: 97, outside: 97.01, orb: 7 },
    { type: "trine", angle: 128, outside: 128.01, orb: 8 },
    { type: "opposition", angle: 188, outside: 188.01, orb: 8 },
  ];

  for (const { type, angle, outside, orb } of cases) {
    const first = singlePlanetChart("sun", 0);
    const exact = computeSynastry(first, singlePlanetChart("moon", angle));
    assert.equal(exact.aspects.length, 1, `${type}: debe aceptar el límite`);
    assert.equal(exact.aspects[0].type, type);
    assert.equal(exact.aspects[0].exactAngle, Math.min(angle, 360 - angle));
    assert.equal(exact.aspects[0].orb, orb);

    const beyond = computeSynastry(first, singlePlanetChart("moon", outside));
    assert.equal(beyond.aspects.length, 0, `${type}: debe rechazar el exceso`);
  }
});

test("la hora local respeta cambios de horario y rechaza horas inexistentes", () => {
  assert.equal(
    civilToUtc("2024-01-01", "12:00", "America/New_York").toISOString(),
    "2024-01-01T17:00:00.000Z",
  );
  assert.throws(
    () => civilToUtc("2024-03-10", "02:30", "America/New_York"),
    /no existió/,
  );
  assert.equal(
    civilToUtc("2024-11-03", "01:30", "America/New_York").toISOString(),
    "2024-11-03T05:30:00.000Z",
  );
  assert.throws(
    () => civilToUtc("2024-02-30", "12:00", "America/New_York"),
    RangeError,
  );
});

test("las compatibilidades varían entre cartas reales y son simétricas", () => {
  const cities = ["us-nyc", "us-la", "gb-lon", "fr-par", "jp-tyo"];
  const charts = Array.from({ length: 8 }, (_, i) => {
    const month = String((i % 12) + 1).padStart(2, "0");
    const day = String((i % 27) + 1).padStart(2, "0");
    const hour = String((i * 2) % 24).padStart(2, "0");
    return computeNatalChart({
      date: `${1988 + i}-${month}-${day}`,
      time: `${hour}:30`,
      cityId: cities[i % cities.length],
      timeUnknown: false,
    });
  });

  const scores = [];
  for (let i = 0; i < charts.length; i++) {
    for (let j = i + 1; j < charts.length; j++) {
      const forward = computeSynastry(charts[i], charts[j]).percent;
      const reverse = computeSynastry(charts[j], charts[i]).percent;
      assert.equal(forward, reverse);
      scores.push(forward);
    }
  }

  assert.ok(
    Math.max(...scores) - Math.min(...scores) >= 10,
    `Las compatibilidades siguen concentradas: ${scores.join(", ")}`,
  );
});

test("referencias angulares guardadas del Sol y la Luna", () => {
  const chart = computeNatalChart(birth);

  const references = {
    sun: 280.5812933,
    moon: 225.8251064,
  };

  const toleranceDegrees = 2 / 3600;

  for (const [id, expected] of Object.entries(references)) {
    const actual = chart.planets.find((planet) => planet.id === id);
    assert.ok(actual, `Falta el cuerpo ${id}`);

    const difference = Math.abs(actual.longitude - expected);
    const angularDifference = Math.min(difference, 360 - difference);

    assert.ok(
      angularDifference <= toleranceDegrees,
      `${id}: diferencia ${(angularDifference * 3600).toFixed(3)} segundos de arco`
    );
  }
});

test("Placidus conserva los grados de referencia del ejemplo de Barinas", () => {
  const chart = computeNatalChart({
    date: "1985-12-15",
    time: "09:00",
    cityId: "barinas",
    timeUnknown: false,
    location: {
      latitude: 8.627,
      longitude: -70.2075,
      timeZone: "America/Caracas",
    },
  });
  const sun = chart.planets.find((planet) => planet.id === "sun");
  const moon = chart.planets.find((planet) => planet.id === "moon");
  const asc = chart.planets.find((planet) => planet.id === "asc");

  assert.equal(chart.houseSystem, "placidus");
  assert.ok(sun && moon && asc);
  assert.ok(Math.abs(sun.longitude - (240 + 23.5)) < 0.01);
  assert.ok(Math.abs(asc.longitude - (270 + 23 + 39 / 60)) < 0.01);
  assert.equal(sun.house, 11);
  assert.equal(moon.house, 1);
  assert.ok(Math.abs(chart.houses[10] - 240.0364) < 0.01);
  assert.ok(Math.abs(chart.houses[11] - 266.7065) < 0.01);
});

test("en latitudes donde Placidus no está definido se identifica el uso de casas iguales", () => {
  const chart = computeNatalChart({
    date: "2000-01-01",
    time: "12:00",
    cityId: "tromso",
    timeUnknown: false,
    location: {
      latitude: 69.6492,
      longitude: 18.9553,
      timeZone: "Europe/Oslo",
    },
  });

  assert.equal(chart.houseSystem, "equal-high-latitude");
  for (let i = 0; i < 12; i++) {
    const next = chart.houses[(i + 1) % 12];
    const distance = (next - chart.houses[i] + 360) % 360;
    assert.ok(Math.abs(distance - 30) < 1e-8);
  }
});

test("usa casas iguales cuando no se pueden resolver cúspides Placidus para una hora candidata", () => {
  const chart = computeNatalChartAtUtc(
    {
      date: "1990-01-01",
      time: "04:10",
      cityId: "",
      timeUnknown: false,
      location: {
        latitude: 40.7,
        longitude: -74,
        timeZone: "UTC",
      },
    },
    new Date("1990-01-01T04:10:00.000Z"),
  );

  assert.equal(chart.houseSystem, "equal");
  assert.ok(Math.abs(chart.houses[0] - chart.triad.asc.longitude) < 1e-8);
});

test("el catálogo expone todos los países y ciudades con coordenadas y zona horaria", async () => {
  const countriesResponse = await getLocations(
    new Request("http://localhost/api/locations"),
  );
  const countries = await countriesResponse.json();
  assert.equal(countries.length, 250);
  assert.ok(countries.some((country) => country.isoCode === "VE"));

  const citiesResponse = await getLocations(
    new Request("http://localhost/api/locations?country=VE&q=Acarigua"),
  );
  const cities = await citiesResponse.json();
  const city = cities.find((item) => item.name === "Acarigua");
  assert.ok(city);
  assert.equal(city.timeZone, "America/Caracas");
  assert.ok(Number.isFinite(city.latitude));
  assert.ok(Number.isFinite(city.longitude));

  const chart = computeNatalChart({
    date: "1990-01-01",
    time: "12:00",
    cityId: city.id,
    timeUnknown: false,
    location: {
      latitude: city.latitude,
      longitude: city.longitude,
      timeZone: city.timeZone,
    },
  });
  assert.equal(chart.planets.length, 12);
});

const {
  buildSynastryInterpretation,
} = require("../src/lib/astro/synastry-interpretation.ts");

function interpretationFixture(overrides = {}) {
  return {
    percent: 72,
    aspects: [],
    hasNodalAspect: false,
    hiloRojo: false,
    timeApproximate: false,
    charts: undefined,
    ...overrides,
  };
}

test("la interpretación conserva trazabilidad exacta hacia los aspectos originales", () => {
  const aspect = {
    a: "sun",
    b: "moon",
    type: "trine",
    orb: 1.2,
    exactAngle: 118.8,
  };

  const report = buildSynastryInterpretation(
    interpretationFixture({ aspects: [aspect] }),
  );

  const emotional = report.sections.find(
    (section) => section.id === "emotional",
  );

  assert.ok(emotional);
  assert.equal(emotional.evidence.length, 1);
  assert.equal(emotional.evidence[0].aspectIndex, 0);
  assert.equal(emotional.evidence[0].planetA, "sun");
  assert.equal(emotional.evidence[0].planetB, "moon");
  assert.equal(emotional.evidence[0].aspect, "trine");
  assert.equal(emotional.evidence[0].orb, 1.2);
  assert.equal(emotional.evidence[0].exactAngle, 118.8);
});

test("la interpretación agrupa cada contacto una sola vez y conserva sus conteos", () => {
  const report = buildSynastryInterpretation(
    interpretationFixture({
      aspects: [
        {
          a: "venus",
          b: "mars",
          type: "trine",
          orb: 2,
          exactAngle: 118,
        },
        {
          a: "sun",
          b: "saturn",
          type: "square",
          orb: 3,
          exactAngle: 87,
        },
      ],
    }),
  );

  const groupedIndexes = report.sections.flatMap((section) =>
    section.evidence.map((item) => item.aspectIndex),
  );
  assert.deepEqual(groupedIndexes.sort(), [0, 1]);
  assert.equal(report.counts.harmonious, 1);
  assert.equal(report.counts.tense, 1);
});

test("la hora desconocida excluye Luna y Ascendente incluso en registros históricos", () => {
  const report = buildSynastryInterpretation(
    interpretationFixture({
      timeApproximate: true,
      aspects: [
        {
          a: "moon",
          b: "venus",
          type: "trine",
          orb: 1,
          exactAngle: 119,
        },
        {
          a: "asc",
          b: "sun",
          type: "conjunction",
          orb: 2,
          exactAngle: 2,
        },
        {
          a: "sun",
          b: "venus",
          type: "sextile",
          orb: 2,
          exactAngle: 62,
        },
      ],
    }),
  );

  assert.equal(report.counts.total, 1);
  assert.ok(
    report.sections.every((section) =>
      section.evidence.every(
        (item) =>
          item.planetA !== "moon" &&
          item.planetB !== "moon" &&
          item.planetA !== "asc" &&
          item.planetB !== "asc",
      ),
    ),
  );
  assert.ok(report.notes.some((note) => note.includes("hora de nacimiento")));
});

test("sin aspectos no inventa interpretaciones ni conclusiones de compatibilidad", () => {
  const report = buildSynastryInterpretation(
    interpretationFixture(),
  );

  assert.equal(report.sections.length, 0);
  assert.equal(report.counts.total, 0);
  assert.match(report.conclusion, /No hay aspectos cruzados registrados/);
});

test("los registros históricos sin cartas advierten que no reconstruyen posiciones", () => {
  const report = buildSynastryInterpretation(
    interpretationFixture({
      aspects: [
        {
          a: "mercury",
          b: "mercury",
          type: "sextile",
          orb: 1,
          exactAngle: 59,
        },
      ],
    }),
  );

  assert.equal(report.hasChartData, false);
  assert.ok(
    report.notes.some((note) => note.includes("no conserva las cartas natales")),
  );
  assert.equal(
    report.sections.find((section) => section.id === "common")
      .evidence[0].aspectIndex,
    0,
  );
});

const {
  buildSynastryCompatibilityOverview,
  buildSynastrySummary,
  buildSynastrySummaryText,
  describeSynastryAspect,
} = require("../src/lib/astro/synastry-summary.ts");

test("el resumen conserva los conteos y prioriza contactos por la misma ponderación del cálculo", () => {
  const aspects = [
    { a: "sun", b: "moon", type: "trine", orb: 5, exactAngle: 125 },
    { a: "venus", b: "mars", type: "sextile", orb: 0.5, exactAngle: 60.5 },
    { a: "mercury", b: "jupiter", type: "square", orb: 2, exactAngle: 92 },
    { a: "sun", b: "saturn", type: "conjunction", orb: 1, exactAngle: 1 },
  ];
  const summary = buildSynastrySummary(
    interpretationFixture({ aspects }),
  );

  assert.equal(summary.total, 4);
  assert.equal(summary.harmonious, 2);
  assert.equal(summary.challenging, 1);
  assert.equal(summary.conjunctions, 1);
  assert.equal(summary.highlights[0].a, "venus");
  assert.equal(summary.highlights.length, 3);
});

test("el resumen omite Luna y Ascendente de registros históricos con hora aproximada", () => {
  const summary = buildSynastrySummary(
    interpretationFixture({
      timeApproximate: true,
      aspects: [
        { a: "moon", b: "venus", type: "trine", orb: 1, exactAngle: 119 },
        { a: "asc", b: "sun", type: "conjunction", orb: 2, exactAngle: 2 },
        { a: "sun", b: "venus", type: "sextile", orb: 2, exactAngle: 62 },
      ],
    }),
  );

  assert.equal(summary.total, 1);
  assert.deepEqual(summary.aspects.map((aspect) => aspect.a), ["sun"]);
});

test("los textos de conexión explican los contactos y resumen fortalezas y retos reales", () => {
  const aspects = [
    { a: "sun", b: "moon", type: "trine", orb: 1, exactAngle: 119 },
    { a: "mercury", b: "jupiter", type: "square", orb: 2, exactAngle: 92 },
    { a: "venus", b: "mars", type: "sextile", orb: 1, exactAngle: 61 },
  ];
  const summary = buildSynastrySummary(
    interpretationFixture({ percent: 89, aspects }),
  );
  const overview = buildSynastryCompatibilityOverview(summary);
  const insight = describeSynastryAspect(aspects[0]);

  assert.equal(overview.compatibility, "Excelente");
  assert.match(overview.challenges, /comunicación y crecimiento/i);
  assert.match(overview.strengths, /pasión y romance/i);
  assert.equal(insight.title, "Compatibilidad profunda y emocional");
  assert.match(insight.explanation, /Favorece la armonía/);
});

test("el texto compartido presenta la compatibilidad sin mensajes que la desacrediten", () => {
  const text = buildSynastrySummaryText(
    "Persona A",
    "Persona B",
    interpretationFixture({
      aspects: [
        { a: "sun", b: "moon", type: "trine", orb: 1, exactAngle: 119 },
      ],
    }),
  );

  assert.match(text, /Compatibilidad astrológica: \d+\/100/);
  assert.match(text, /identidad y las necesidades emocionales/);
  assert.match(text, /Favorece la armonía/);
  assert.doesNotMatch(text, /no es una probabilidad|medida científica|no predice/i);
});

test("el PDF de sinastría se genera con resumen y detalles registrados", async () => {
  const chartA = computeNatalChart(birth);
  const chartB = computeNatalChart({
    ...birth,
    date: "1997-07-17",
    time: "09:30",
  });
  const result = {
    ...computeSynastry(chartA, chartB),
    charts: { a: chartA, b: chartB },
  };
  const pdf = await createSynastryPdf(
    "Persona A",
    "Persona B",
    result,
    "2026-11-01T22:00:00.000Z",
  );

  assert.equal(pdf.type, "application/pdf");
  assert.ok(pdf.size > 1000);
});

test("el catálogo no convierte una conjunción en armonía automática", () => {
  const report = buildSynastryInterpretation(
    interpretationFixture({
      aspects: [
        {
          a: "sun",
          b: "sun",
          type: "conjunction",
          orb: 0.4,
          exactAngle: 0.4,
        },
      ],
    }),
  );

  assert.equal(report.counts.conjunctions, 1);
  assert.equal(report.counts.harmonious, 0);
  assert.equal(report.counts.tense, 0);
  assert.ok(
    report.sections.some((section) => section.id === "common"),
  );
});
