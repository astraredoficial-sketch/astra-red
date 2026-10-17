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

const { computeNatalChart } = require("../src/lib/astro/chart.ts");
const { computeSynastry } = require("../src/lib/astro/synastry.ts");
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
