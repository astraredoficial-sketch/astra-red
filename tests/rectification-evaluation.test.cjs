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
  generateBirthTimeCandidates,
} = require("../src/lib/astro/rectification/candidates.ts");
const {
  DEFAULT_RECTIFICATION_EVALUATION_CONFIG,
  evaluateRectificationCandidates,
} = require("../src/lib/astro/rectification/evaluation.ts");

const candidates = generateBirthTimeCandidates(
  { date: "2000-01-01", time: "11:50" },
  { date: "2000-01-01", time: "12:10" },
  "America/New_York",
  10,
).candidates;
const maximumCandidateGrid = generateBirthTimeCandidates(
  { date: "2000-01-01", time: "00:00" },
  { date: "2000-01-01", time: "04:59" },
  "America/New_York",
  1,
).candidates;

const input = {
  birthDate: "2000-01-01",
  birthLocation: {
    latitude: 40.7128,
    longitude: -74.006,
    timeZone: "America/New_York",
  },
  candidates,
  events: [
    {
      id: "event-marriage",
      category: "marriage",
      dateStart: "2020-06-15",
      dateEnd: "2020-06-15",
      datePrecision: "exact",
      eventTimeZone: null,
      relevance: 5,
    },
  ],
};

test("evaluates all three techniques and records reproducible configuration", () => {
  const result = evaluateRectificationCandidates(input);

  assert.equal(result.methodologyVersion, "traditional-v1");
  assert.deepEqual(result.astronomicalConfiguration.normalizedTechniqueWeights, {
    transits: 1 / 3,
    secondaryProgressions: 1 / 3,
    solarArc: 1 / 3,
  });
  assert.equal(result.astronomicalConfiguration.zodiac, "tropical");
  assert.equal(result.astronomicalConfiguration.progressedDayPerYear, 365.24219);
  assert.equal(result.candidates.length, 3);
  assert.ok(result.candidates.every(({ score }) => score >= 0 && score <= 1));
  assert.ok(
    result.candidates.every(
      ({ eventEvidence }) =>
        eventEvidence[0].techniqueScores.transits >= 0 &&
        eventEvidence[0].techniqueScores.secondaryProgressions >= 0 &&
        eventEvidence[0].techniqueScores.solarArc >= 0,
    ),
  );
  assert.equal(
    result.candidates[0].eventEvidence[0].timezoneUsed,
    "America/New_York",
  );
  assert.equal(
    result.candidates[0].eventEvidence[0].timezoneSource,
    "birth",
  );
  assert.ok(
    result.candidates.every((candidate, index, list) =>
      index === 0 || list[index - 1].score >= candidate.score,
    ),
  );
});

test("reports an ambiguous ranking without selecting a birth time", () => {
  const result = evaluateRectificationCandidates(input, {
    ...DEFAULT_RECTIFICATION_EVALUATION_CONFIG,
    ambiguityMargin: 1,
  });

  assert.equal(result.status, "ambiguous");
  assert.equal(result.recommendedCandidateUtc, null);
});

test("supports configurable technique weights and event time zones", () => {
  const result = evaluateRectificationCandidates(
    {
      ...input,
      events: [
        {
          ...input.events[0],
          eventTimeZone: "Europe/Madrid",
        },
      ],
    },
    {
      ...DEFAULT_RECTIFICATION_EVALUATION_CONFIG,
      techniqueWeights: {
        transits: 0,
        secondaryProgressions: 2,
        solarArc: 0,
      },
    },
  );

  const candidate = result.candidates[0];
  assert.deepEqual(
    result.astronomicalConfiguration.normalizedTechniqueWeights,
    { transits: 0, secondaryProgressions: 1, solarArc: 0 },
  );
  assert.equal(candidate.eventEvidence[0].timezoneUsed, "Europe/Madrid");
  assert.equal(candidate.eventEvidence[0].timezoneSource, "event");
  assert.equal(candidate.eventEvidence[0].techniqueScores.transits, 0);
  assert.equal(candidate.eventEvidence[0].techniqueScores.solarArc, 0);
});

test("rejects malformed, duplicate, or inconsistent candidates and invalid weights", () => {
  assert.throws(
    () =>
      evaluateRectificationCandidates({
        ...input,
        candidates: [
          { ...input.candidates[0], utc: "not-an-instant" },
        ],
      }),
    /candidato de nacimiento no válido/,
  );
  assert.throws(
    () =>
      evaluateRectificationCandidates({
        ...input,
        candidates: [input.candidates[0], input.candidates[0]],
      }),
    /no coinciden|no puede repetir/,
  );
  assert.throws(
    () =>
      evaluateRectificationCandidates(input, {
        ...DEFAULT_RECTIFICATION_EVALUATION_CONFIG,
        techniqueWeights: {
          transits: 0,
          secondaryProgressions: 0,
          solarArc: 0,
        },
      }),
    /peso mayor que cero/,
  );
});

test("enforces evaluation limits and keeps absence of evidence distinct", () => {
  const result = evaluateRectificationCandidates(input, {
    ...DEFAULT_RECTIFICATION_EVALUATION_CONFIG,
    orbLimits: { transits: 0.000001, secondaryProgressions: 0.000001, solarArc: 0.000001 },
    minimumEvidenceScore: 1,
  });

  assert.equal(result.status, "insufficient_evidence");
  assert.equal(result.recommendedCandidateUtc, null);
  assert.throws(
    () =>
      evaluateRectificationCandidates({
        ...input,
        candidates: Array.from({ length: 301 }, (_, index) => ({
          ...input.candidates[0],
          utc: new Date(
            Date.parse(input.candidates[0].utc) + (index + 1) * 60_000,
          ).toISOString(),
        })),
      }),
    /máximo de 300/,
  );
  assert.throws(
    () =>
      evaluateRectificationCandidates({
        ...input,
        candidates: maximumCandidateGrid,
        events: Array.from({ length: 50 }, (_, index) => ({
          ...input.events[0],
          id: `event-${index}`,
        })),
      }),
    /muestras candidato-acontecimiento/,
  );
});
