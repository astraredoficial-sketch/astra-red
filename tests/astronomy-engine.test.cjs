const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
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

const {
  ASTRAL_ACTIVITIES,
  calculateRealAstralData,
  findOptimalAstralDates,
  getAstralCalendarDays,
} = require("../src/lib/astronomyEngine.ts");

test("el calendario lunar muestra todos los días del mes, incluso en año bisiesto", () => {
  const days = getAstralCalendarDays(2028, 2);

  assert.equal(days.length, 29);
  assert.equal(days[0].date, "2028-02-01");
  assert.equal(days[28].date, "2028-02-29");
  assert.ok(days.every((day) => day.illumination >= 0 && day.illumination <= 100));
});

test("las recomendaciones de fase creciente solo incluyen fechas crecientes", () => {
  const dates = findOptimalAstralDates("hair-growth", 2027, 3, 3);

  assert.ok(dates.length > 0 && dates.length <= 3);
  assert.ok(
    dates.every((date) => date.phaseValue >= 0.03 && date.phaseValue < 0.5),
  );
  assert.equal(new Set(dates.map((date) => date.date)).size, dates.length);
});

test("las recomendaciones de fase menguante solo incluyen fechas menguantes", () => {
  const dates = findOptimalAstralDates("pruning-harvest", 2027, 3, 3);

  assert.ok(dates.length > 0 && dates.length <= 3);
  assert.ok(
    dates.every((date) => date.phaseValue > 0.5 && date.phaseValue < 0.97),
  );
});

test("las fechas se calculan sin desplazamiento de día por zona horaria", () => {
  const result = calculateRealAstralData(
    new Date(Date.UTC(2027, 0, 1, 12)),
    "moon-observation",
  );

  assert.equal(result.date, "2027-01-01");
});

test("las fases lunares concuerdan con referencias de luna nueva y llena", () => {
  const newMoon = calculateRealAstralData(
    new Date("2000-01-06T18:14:00.000Z"),
    "moon-observation",
  );
  const fullMoon = calculateRealAstralData(
    new Date("2000-01-21T04:40:00.000Z"),
    "moon-observation",
  );

  assert.ok(newMoon.illumination < 1, `Iluminación de luna nueva: ${newMoon.illumination}%`);
  assert.ok(fullMoon.illumination > 99, `Iluminación de luna llena: ${fullMoon.illumination}%`);
});

test("el motor detecta periodos conocidos de retrogradación", () => {
  const retrograde = calculateRealAstralData(
    new Date("2025-03-20T12:00:00.000Z"),
    "moon-observation",
  );

  assert.equal(retrograde.mercuryRetrograde, true);
  assert.equal(retrograde.venusRetrograde, true);
});

test("el calendario ofrece intenciones de hogar, vehículos, relaciones y trabajo", () => {
  for (const activity of [
    "home-purchase",
    "vehicle-purchase",
    "wedding",
    "business-launch",
    "job-interview",
    "travel",
    "contract-signing",
  ]) {
    assert.ok(ASTRAL_ACTIVITIES.includes(activity));
  }
});

test("las sugerencias incluyen signo lunar, índice y criterios de la intención", () => {
  const dates = findOptimalAstralDates("home-purchase", 2027, 3, 3);

  assert.equal(dates.length, 3);
  assert.ok(
    dates.every(
      (date) =>
        typeof date.moonSign === "string" &&
        date.score >= 0 &&
        date.score <= 100 &&
        date.recommendation.includes("Mercurio") &&
        date.recommendation.includes("Luna en"),
    ),
  );
});

test("las recomendaciones de boda consideran a Venus y el signo lunar", () => {
  const dates = findOptimalAstralDates("wedding", 2027, 6, 6);

  assert.ok(dates.length > 0 && dates.length <= 3);
  assert.ok(
    dates.every(
      (date) =>
        date.recommendation.includes("Venus") &&
        date.recommendation.includes("Luna en"),
    ),
  );
});

test("el motor rechaza rangos de calendario inválidos", () => {
  assert.throws(
    () => findOptimalAstralDates("planting", 2027, 0, 13),
    RangeError,
  );
  assert.throws(
    () => getAstralCalendarDays(2027, 13),
    RangeError,
  );
});
