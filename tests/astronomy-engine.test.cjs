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
  calculateCurrentSky,
  calculateRealAstralData,
  findOptimalAstralDates,
  getDateKeyInTimeZone,
  getAstralCalendarDays,
  getUtcInstantAtLocalNoon,
} = require("../src/lib/astronomyEngine.ts");

function createTestChart(timeUnknown = false) {
  const ids = [
    "sun", "moon", "mercury", "venus", "mars", "jupiter",
    "saturn", "uranus", "neptune", "pluto", "node", "asc",
  ];
  return {
    timeUnknown,
    planets: ids.map((id, index) => ({
      id,
      longitude: index * 29.7,
      sign: "Aries",
      signIndex: 0,
      degreeInSign: index,
      house: index + 1,
    })),
  };
}

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

test("el mediodía del calendario respeta zona horaria y cambios estacionales", () => {
  assert.equal(
    getUtcInstantAtLocalNoon("2026-10-16", "America/Caracas").toISOString(),
    "2026-10-16T16:00:00.000Z",
  );
  assert.equal(
    getUtcInstantAtLocalNoon("2026-03-07", "America/New_York").toISOString(),
    "2026-03-07T17:00:00.000Z",
  );
  assert.equal(
    getUtcInstantAtLocalNoon("2026-03-09", "America/New_York").toISOString(),
    "2026-03-09T16:00:00.000Z",
  );
  assert.equal(
    getUtcInstantAtLocalNoon("2026-10-16", "Pacific/Kiritimati").toISOString(),
    "2026-10-15T22:00:00.000Z",
  );
});

test("las fechas lunares del calendario conservan el día civil y usan mediodía local", () => {
  const date = getAstralCalendarDays(2026, 10, "America/Caracas")[15];
  const localNoon = calculateRealAstralData(
    getUtcInstantAtLocalNoon("2026-10-16", "America/Caracas"),
    "moon-observation",
  );

  assert.equal(date.date, "2026-10-16");
  assert.equal(date.phaseValue, localNoon.phaseValue);
  assert.equal(date.illumination, localNoon.illumination);
  assert.equal(date.moonSign, localNoon.moonSign);
  assert.equal(
    getDateKeyInTimeZone(
      new Date("2026-10-17T01:30:00.000Z"),
      "America/Caracas",
    ),
    "2026-10-16",
  );
});

test("las fechas sugeridas también se calculan al mediodía de la zona elegida", () => {
  const suggestedDates = findOptimalAstralDates(
    "moon-observation",
    2026,
    10,
    10,
    "America/Caracas",
  );

  assert.ok(suggestedDates.length > 0);
  for (const suggestedDate of suggestedDates) {
    const localNoon = calculateRealAstralData(
      getUtcInstantAtLocalNoon(suggestedDate.date, "America/Caracas"),
      "moon-observation",
    );
    assert.equal(suggestedDate.phaseValue, localNoon.phaseValue);
    assert.equal(suggestedDate.illumination, localNoon.illumination);
    assert.equal(suggestedDate.moonSign, localNoon.moonSign);
  }
});

test("el mediodía local rechaza fechas y zonas horarias inválidas", () => {
  assert.throws(
    () => getUtcInstantAtLocalNoon("2026-02-30", "UTC"),
    RangeError,
  );
  assert.throws(
    () => getUtcInstantAtLocalNoon("0000-10-16", "UTC"),
    RangeError,
  );
  assert.throws(
    () => getUtcInstantAtLocalNoon("2026-10-16", "Invalid/Zone"),
    RangeError,
  );
});

test("la lectura actual usa la hora exacta y destaca tránsitos cercanos a la carta", () => {
  const instant = new Date("2026-10-16T16:00:00.000Z");
  const chart = createTestChart();
  const todaySky = calculateCurrentSky(chart, instant);
  const lunarData = calculateRealAstralData(instant, "moon-observation");

  assert.equal(todaySky.calculatedAt, instant.toISOString());
  assert.equal(todaySky.phaseName, lunarData.phaseName);
  assert.equal(todaySky.illumination, lunarData.illumination);
  assert.equal(todaySky.moonSign, lunarData.moonSign);
  assert.deepEqual(
    todaySky.transits.map(({ id }) => id),
    ["sun", "moon", "mercury", "venus", "mars"],
  );
  assert.ok(todaySky.aspects.every((aspect) => aspect.orb <= 3));
  assert.ok(
    todaySky.aspects.every(
      (aspect, index, aspects) =>
        index === 0 || aspects[index - 1].orb <= aspect.orb,
    ),
  );
});

test("la hora desconocida excluye tránsitos sobre Luna y Ascendente natales", () => {
  const todaySky = calculateCurrentSky(
    createTestChart(true),
    new Date("2026-10-16T16:00:00.000Z"),
  );

  assert.ok(
    todaySky.aspects.every(
      ({ natal }) => natal !== "moon" && natal !== "asc",
    ),
  );
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
