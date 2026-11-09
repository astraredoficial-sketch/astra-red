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
  isValidIanaTimeZone,
  validateRectificationInput,
  validateRectificationEventInput,
} = require("../src/lib/astro/rectification/validation.ts");

const rectificationInput = {
  birthDate: "1985-12-15",
  birthCity: "Barinas",
  birthCountry: "Venezuela",
  latitude: 8.627,
  longitude: -70.2075,
  timeZone: "America/Caracas",
  intervalStart: { date: "1985-12-15", time: "07:00" },
  intervalEnd: { date: "1985-12-15", time: "11:00" },
  stepMinutes: 5,
};

const exactEvent = {
  category: "marriage",
  dateStart: "2010-06-12",
  dateEnd: "2010-06-12",
  datePrecision: "exact",
  eventTimeZone: "America/Caracas",
  description: "Ceremonia civil",
  relevance: 5,
};

test("validates a rectification configuration without changing its precision", () => {
  assert.deepEqual(validateRectificationInput(rectificationInput), rectificationInput);
});

test("recognizes IANA time zones and rejects abbreviations or fixed offsets", () => {
  assert.equal(isValidIanaTimeZone("America/Caracas"), true);
  assert.equal(isValidIanaTimeZone("UTC"), true);
  assert.equal(isValidIanaTimeZone("VET"), false);
  assert.equal(isValidIanaTimeZone("UTC-4"), false);
});

test("rejects invalid coordinates, invalid IANA zones, reversed and out-of-birth intervals", () => {
  assert.throws(
    () => validateRectificationInput({ ...rectificationInput, latitude: 90.01 }),
    /latitud/,
  );
  assert.throws(
    () => validateRectificationInput({ ...rectificationInput, timeZone: "Local/Server" }),
    /zona horaria IANA/,
  );
  assert.throws(
    () =>
      validateRectificationInput({
        ...rectificationInput,
        intervalStart: { date: "1985-12-15", time: "11:00" },
        intervalEnd: { date: "1985-12-15", time: "07:00" },
      }),
    /posterior al inicio/,
  );
  assert.throws(
    () =>
      validateRectificationInput({
        ...rectificationInput,
        birthDate: "1985-12-16",
      }),
    /dentro del intervalo/,
  );
  assert.throws(
    () => validateRectificationInput({ ...rectificationInput, user_id: "attacker" }),
    /campos no permitidos/,
  );
});

test("validates event dates, categories, precision, relevance, timezone, and description", () => {
  assert.equal(validateRectificationEventInput(exactEvent).category, "marriage");
  assert.throws(
    () =>
      validateRectificationEventInput({
        ...exactEvent,
        category: "unrecognized",
      }),
    /categoría/,
  );
  assert.throws(
    () =>
      validateRectificationEventInput({
        ...exactEvent,
        datePrecision: "exact",
        dateEnd: "2010-06-13",
      }),
    /precisión exacta/,
  );
  assert.throws(
    () =>
      validateRectificationEventInput({
        ...exactEvent,
        dateStart: "2010-06-13",
        dateEnd: "2010-06-12",
        datePrecision: "interval",
      }),
    /no puede preceder/,
  );
  assert.throws(
    () => validateRectificationEventInput({ ...exactEvent, relevance: 0 }),
    /relevancia/,
  );
  assert.throws(
    () =>
      validateRectificationEventInput({
        ...exactEvent,
        eventTimeZone: "Local/Server",
      }),
    /zona horaria IANA/,
  );
  assert.throws(
    () => validateRectificationEventInput({ ...exactEvent, hidden: true }),
    /campos no permitidos/,
  );
});

test("partial event updates reject empty bodies and preserve independently edited fields", () => {
  assert.throws(
    () => validateRectificationEventInput({}, true),
    /al menos un campo/,
  );

  const updated = validateRectificationEventInput({ relevance: 2 }, true);
  assert.deepEqual(updated, { relevance: 2 });
  assert.throws(
    () => validateRectificationEventInput({ relevance: "high" }, true),
    /relevancia/,
  );
});
