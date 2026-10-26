const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const Astronomy = require("astronomy-engine");

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

const { findNextLunarReturn } = require("../src/lib/lunarReturn.ts");

function angularDifference(a, b) {
  const difference = Math.abs(a - b) % 360;
  return Math.min(difference, 360 - difference);
}

test("finds the next return close to a known lunar longitude crossing", () => {
  const expected = new Date("2026-01-15T12:00:00.000Z");
  const natalLongitude = Astronomy.EclipticGeoMoon(expected).lon;
  const start = new Date(expected.getTime() - 20 * 24 * 60 * 60 * 1000);

  const result = findNextLunarReturn(natalLongitude, start);

  assert.ok(
    Math.abs(result.getTime() - expected.getTime()) < 60 * 60 * 1000,
    `Expected a return near ${expected.toISOString()}, got ${result.toISOString()}`,
  );

  const actualLongitude = Astronomy.EclipticGeoMoon(result).lon;
  assert.ok(angularDifference(actualLongitude, natalLongitude) < 0.01);
});

test("searches the following cycle when started just after a return", () => {
  const crossing = new Date("2026-01-15T12:00:00.000Z");
  const natalLongitude = Astronomy.EclipticGeoMoon(crossing).lon;
  const start = new Date(crossing.getTime() + 60 * 60 * 1000);

  const result = findNextLunarReturn(natalLongitude, start);
  const elapsedDays = (result.getTime() - start.getTime()) / 86400000;

  assert.ok(elapsedDays > 25 && elapsedDays < 30);
  assert.ok(result > start);
});

test("rejects invalid longitude, instant, and search range", () => {
  assert.throws(
    () => findNextLunarReturn(-1, new Date("2026-01-01T00:00:00Z")),
    RangeError,
  );
  assert.throws(
    () => findNextLunarReturn(360, new Date("2026-01-01T00:00:00Z")),
    RangeError,
  );
  assert.throws(
    () => findNextLunarReturn(100, new Date("invalid")),
    RangeError,
  );
  assert.throws(
    () => findNextLunarReturn(100, new Date(), 0),
    RangeError,
  );
});