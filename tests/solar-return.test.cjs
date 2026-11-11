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

const { calculateSolarReturn } = require("../src/lib/astro/solarReturn.ts");
const { angleDelta } = require("../src/lib/astro/constants.ts");
const {
  computeNatalAnglesAtUtc,
  computePlanetaryLongitudesAtUtc,
} = require("../src/lib/astro/chart.ts");
const { civilToUtcCandidates } = require("../src/lib/astro/time.ts");

const birth = {
  birthDate: "1985-12-15",
  birthTime: "09:00",
  birthTimeUnknown: false,
  cityId: "ve-ccs",
  latitude: 10.4806,
  longitude: -66.9036,
  timeZone: "America/Caracas",
  city: "Caracas",
  country: "Venezuela",
};

test("calcula el retorno solar con la longitud tropical natal del Sol", () => {
  const result = calculateSolarReturn(birth, 2026);
  const returnSun = result.chart.planets.find(({ id }) => id === "sun");

  assert.ok(returnSun);
  assert.ok(angleDelta(returnSun.longitude, result.natalSunLongitude) < 0.0001);
  assert.equal(result.chart.timeUnknown, false);
  assert.equal(result.approximate, false);
  assert.equal(result.methodologyVersion, "astronomy-engine-apparent-sun-longitude-v1");
  assert.equal(result.readings.length, 5);
  assert.ok(Number.isFinite(Date.parse(result.returnAtUtc)));
  const expectedAngles = computeNatalAnglesAtUtc(
    new Date(result.returnAtUtc),
    birth.latitude,
    birth.longitude,
  );
  assert.ok(
    angleDelta(result.chart.triad.asc.longitude, expectedAngles.ascendant) <
      1e-8,
  );
});

test("marca como aproximado el retorno cuando la hora natal es desconocida", () => {
  const result = calculateSolarReturn(
    { ...birth, birthTime: null, birthTimeUnknown: true },
    2026,
  );

  assert.equal(result.approximate, true);
  assert.ok(result.readings.some(({ id }) => id === "wellbeing"));
});

test("rechaza una hora natal repetida por el cambio histórico de horario", () => {
  assert.throws(
    () =>
      calculateSolarReturn(
        {
          ...birth,
          birthDate: "2021-11-07",
          birthTime: "01:30",
          timeZone: "America/New_York",
        },
        2026,
      ),
    /ocurrió dos veces/,
  );
});

test("rechaza una hora natal inexistente durante el cambio de horario", () => {
  assert.throws(
    () =>
      calculateSolarReturn(
        {
          ...birth,
          birthDate: "2021-03-14",
          birthTime: "02:30",
          timeZone: "America/New_York",
        },
        2026,
      ),
    /no existió/,
  );
});

test("valida año, coordenadas y zona horaria antes del cálculo", () => {
  assert.throws(() => calculateSolarReturn(birth, 2201), /entre 1900 y 2200/);
  assert.throws(
    () => calculateSolarReturn({ ...birth, latitude: 91 }, 2026),
    /coordenadas geográficas/,
  );
  assert.throws(
    () => calculateSolarReturn({ ...birth, timeZone: "UTC-4" }, 2026),
    /zona IANA válida/,
  );
});

test("resuelve el retorno de un nacimiento del 29 de febrero en año no bisiesto", () => {
  const result = calculateSolarReturn(
    { ...birth, birthDate: "2000-02-29" },
    2025,
  );
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: birth.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(result.returnAtUtc));

  assert.match(localDate, /^2025-02-(28|29)$/);
});

test("convierte correctamente una hora natal próxima a medianoche a UTC", () => {
  const boundaryBirth = {
    ...birth,
    birthDate: "2000-01-01",
    birthTime: "00:30",
    timeZone: "Pacific/Kiritimati",
  };
  const birthInstant = civilToUtcCandidates(
    boundaryBirth.birthDate,
    boundaryBirth.birthTime,
    boundaryBirth.timeZone,
  )[0];
  const expectedSun = computePlanetaryLongitudesAtUtc(birthInstant).sun;
  const result = calculateSolarReturn(boundaryBirth, 2026);

  assert.equal(birthInstant.toISOString(), "1999-12-31T10:30:00.000Z");
  assert.ok(
    typeof expectedSun === "number" &&
      angleDelta(result.natalSunLongitude, expectedSun) < 1e-12,
  );
});
