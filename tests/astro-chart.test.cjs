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

test("las doce casas actuales están separadas por treinta grados", () => {
  const chart = computeNatalChart(birth);

  assert.equal(chart.houses.length, 12);

  for (let i = 0; i < 12; i++) {
    const next = chart.houses[(i + 1) % 12];
    const distance = (next - chart.houses[i] + 360) % 360;
    assert.ok(Math.abs(distance - 30) < 1e-8, `Separación incorrecta en la casa ${i + 1}`);
  }
});

test("la tríada coincide con los planetas correspondientes", () => {
  const chart = computeNatalChart(birth);

  for (const id of ["sun", "moon", "asc"]) {
    const planet = chart.planets.find((item) => item.id === id);
    assert.ok(planet, `Falta ${id} en la lista de puntos`);
    assert.deepEqual(chart.triad[id], planet);
  }

  assert.ok(Number.isFinite(chart.julianDay));
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
