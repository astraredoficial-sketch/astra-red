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

const { civilToUtc, civilToUtcCandidates } = require("../src/lib/astro/time.ts");
const {
  generateBirthTimeCandidates,
} = require("../src/lib/astro/rectification/candidates.ts");

test("resolves both UTC instants for an ambiguous historical local time", () => {
  const candidates = civilToUtcCandidates(
    "2024-11-03",
    "01:30",
    "America/New_York",
  );

  assert.deepEqual(
    candidates.map((candidate) => candidate.toISOString()),
    ["2024-11-03T05:30:00.000Z", "2024-11-03T06:30:00.000Z"],
  );
  assert.equal(
    civilToUtc("2024-11-03", "01:30", "America/New_York").toISOString(),
    candidates[0].toISOString(),
  );
});

test("generates an inclusive local-time grid with explicit DST occurrences", () => {
  const result = generateBirthTimeCandidates(
    { date: "2024-11-03", time: "01:00" },
    { date: "2024-11-03", time: "02:00" },
    "America/New_York",
    30,
  );

  assert.deepEqual(
    result.candidates.map(({ localTime, utc, occurrence }) => [
      localTime,
      utc,
      occurrence,
    ]),
    [
      ["01:00", "2024-11-03T05:00:00.000Z", "earlier"],
      ["01:30", "2024-11-03T05:30:00.000Z", "earlier"],
      ["01:00", "2024-11-03T06:00:00.000Z", "later"],
      ["01:30", "2024-11-03T06:30:00.000Z", "later"],
      ["02:00", "2024-11-03T07:00:00.000Z", "unique"],
    ],
  );
});

test("skips nonexistent local times during a daylight-saving gap", () => {
  const result = generateBirthTimeCandidates(
    { date: "2024-03-10", time: "01:30" },
    { date: "2024-03-10", time: "03:30" },
    "America/New_York",
    30,
  );

  assert.equal(result.skippedNonexistentLocalTimes, 2);
  assert.deepEqual(
    result.candidates.map(({ localTime }) => localTime),
    ["01:30", "03:00", "03:30"],
  );
});

test("converts local candidate dates across UTC midnight without changing local labels", () => {
  const result = generateBirthTimeCandidates(
    { date: "2024-01-01", time: "00:00" },
    { date: "2024-01-01", time: "00:30" },
    "Pacific/Kiritimati",
    30,
  );

  assert.equal(result.candidates[0].localDate, "2024-01-01");
  assert.equal(result.candidates[0].utc, "2023-12-31T10:00:00.000Z");
  assert.equal(result.candidates[1].utc, "2023-12-31T10:30:00.000Z");
});

test("validates interval dates, ordering, step size, time zone, and candidate count", () => {
  const options = {
    start: { date: "2024-01-01", time: "00:00" },
    end: { date: "2024-01-01", time: "01:00" },
    timeZone: "UTC",
  };

  assert.throws(
    () => generateBirthTimeCandidates(options.start, options.end, "UTC", 0),
    RangeError,
  );
  assert.throws(
    () =>
      generateBirthTimeCandidates(
        options.end,
        options.start,
        options.timeZone,
      ),
    RangeError,
  );
  assert.throws(
    () =>
      generateBirthTimeCandidates(
        { date: "2024-02-30", time: "00:00" },
        options.end,
        options.timeZone,
      ),
    RangeError,
  );
  assert.throws(
    () =>
      generateBirthTimeCandidates(
        { date: "2024-03-10", time: "02:00" },
        { date: "2024-03-10", time: "02:30" },
        "America/New_York",
        30,
      ),
    /no contiene horas locales válidas/,
  );
  assert.throws(
    () => generateBirthTimeCandidates(options.start, options.end, "Invalid/Zone"),
    RangeError,
  );
  assert.throws(
    () =>
      generateBirthTimeCandidates(
        options.start,
        { date: "2024-01-01", time: "05:00" },
        options.timeZone,
        1,
      ),
    /máximo de 300 candidatos/,
  );
});
