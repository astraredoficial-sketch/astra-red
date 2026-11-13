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
  calculateDailyHoroscope,
  getLocalCalendarDate,
} = require("../src/lib/astro/dailyHoroscope.ts");
const {
  buildHoroscopeShareText,
  buildHoroscopeShareUrl,
  getHoroscopeSignFromSlug,
  getHoroscopeSignSlug,
} = require("../src/lib/astro/horoscopeShare.ts");

test("calcula una lectura para los doce signos con el cielo de mediodía local", () => {
  const result = calculateDailyHoroscope("2026-11-11", "America/Caracas");

  assert.equal(result.readings.length, 12);
  assert.equal(result.date, "2026-11-11");
  assert.equal(result.timeZone, "America/Caracas");
  assert.equal(result.calculatedAt, "2026-11-11T16:00:00.000Z");
  assert.ok(result.sky.sunSign);
  assert.ok(result.sky.moonSign);
  assert.ok(result.sky.lunarPhase);

  for (const [index, reading] of result.readings.entries()) {
    assert.equal(reading.signIndex, index);
    assert.ok(reading.glyph);
    assert.ok(reading.overview.length > 30);
    assert.ok(reading.love.length > 30);
    assert.ok(reading.work.length > 30);
    assert.ok(reading.wellbeing.length > 30);
    assert.ok(reading.action.length > 30);
    assert.ok(reading.luckyNumber >= 1 && reading.luckyNumber <= 90);
    assert.ok(reading.luckyColor);
    assert.ok(reading.affirmation);
  }
});

test("la fecha del horóscopo sigue la zona horaria local del visitante", () => {
  const instant = new Date("2026-11-11T02:00:00.000Z");

  assert.equal(
    getLocalCalendarDate(instant, "America/Caracas"),
    "2026-11-10",
  );
  assert.equal(
    getLocalCalendarDate(instant, "Asia/Tokyo"),
    "2026-11-11",
  );
});

test("una fecha y zona iguales producen una lectura estable", () => {
  const first = calculateDailyHoroscope("2026-11-11", "Asia/Tokyo");
  const second = calculateDailyHoroscope("2026-11-11", "Asia/Tokyo");

  assert.deepEqual(first, second);
});

test("la prosa principal cambia al día siguiente para los doce signos", () => {
  const previous = calculateDailyHoroscope("2026-11-11", "America/Caracas");
  const current = calculateDailyHoroscope("2026-11-12", "America/Caracas");

  assert.equal(new Set(current.readings.map(({ overview }) => overview)).size, 12);
  for (const [index, reading] of current.readings.entries()) {
    assert.notEqual(reading.overview, previous.readings[index].overview);
  }
});

test("la prosa diaria también cambia al cruzar el fin de año", () => {
  const previous = calculateDailyHoroscope("2026-12-31", "America/Caracas");
  const current = calculateDailyHoroscope("2027-01-01", "America/Caracas");

  for (const [index, reading] of current.readings.entries()) {
    assert.notEqual(reading.overview, previous.readings[index].overview);
  }
});

test("cada signo recibe prosa distinta durante un ciclo anual", () => {
  const proseBySign = Array.from({ length: 12 }, () => new Set());
  const start = new Date("2026-11-12T00:00:00.000Z");

  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + offset);
    const horoscope = calculateDailyHoroscope(
      date.toISOString().slice(0, 10),
      "America/Caracas",
    );

    horoscope.readings.forEach((reading, index) => {
      proseBySign[index].add(reading.overview);
    });
  }

  for (const prose of proseBySign) {
    assert.equal(prose.size, 365);
  }
});

test("rechaza fechas civiles y zonas horarias inválidas", () => {
  assert.throws(
    () => calculateDailyHoroscope("2026-02-30", "UTC"),
    /fecha local no es válida/,
  );
  assert.throws(
    () => calculateDailyHoroscope("2026-11-11", "UTC-4"),
    /zona horaria del visitante no es válida/,
  );
});

test("crea enlaces compartibles que vuelven a seleccionar el signo", () => {
  const url = new URL(buildHoroscopeShareUrl("Géminis"));

  assert.equal(url.origin, "https://astrared.vip");
  assert.equal(url.pathname, "/horoscopo");
  assert.equal(url.searchParams.get("sign"), "geminis");
  assert.equal(getHoroscopeSignSlug("Cáncer"), "cancer");
  assert.equal(getHoroscopeSignFromSlug("sagitario"), 8);
  assert.equal(getHoroscopeSignFromSlug("no-es-un-signo"), null);
  assert.throws(() => buildHoroscopeShareUrl("Ofiuco"), /signo seleccionado/);
});

test("incluye las áreas de la lectura y el enlace del signo en el mensaje", () => {
  const horoscope = calculateDailyHoroscope("2026-11-11", "America/Caracas");
  const text = buildHoroscopeShareText(horoscope.readings[2], horoscope.date);

  assert.match(text, /Géminis/);
  assert.match(text, /Amor:/);
  assert.match(text, /Trabajo:/);
  assert.match(text, /Bienestar:/);
  assert.match(text, /Número simbólico:/);
  assert.match(text, /https:\/\/astrared\.vip\/horoscopo\?sign=geminis/);
});
