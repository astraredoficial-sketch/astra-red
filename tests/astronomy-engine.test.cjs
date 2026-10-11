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
