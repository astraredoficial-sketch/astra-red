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
    },
  });
  module._compile(compiled.outputText, filename);
};

const { isMissingAuthSessionError } = require("../src/lib/supabase/session.ts");

test("identifica una sesión ausente como un estado anónimo esperado", () => {
  assert.equal(isMissingAuthSessionError({ name: "AuthSessionMissingError" }), true);
});

test("no oculta errores de autenticación distintos a una sesión ausente", () => {
  assert.equal(isMissingAuthSessionError({ name: "AuthRetryableFetchError" }), false);
  assert.equal(isMissingAuthSessionError(null), false);
});
