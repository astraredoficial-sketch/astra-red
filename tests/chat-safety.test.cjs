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

const { containsObsceneLanguage } = require("../supabase/functions/chat-assistant/chat-safety.ts");
const { getIcebreakers } = require("../src/lib/chat/icebreakers.ts");

test("chat safety blocks common obscene terms and common obfuscation", () => {
  assert.equal(containsObsceneLanguage("Eres un pendejo"), true);
  assert.equal(containsObsceneLanguage("que m1erd4"), true);
  assert.equal(containsObsceneLanguage("Qué coño haces"), true);
});

test("chat safety allows respectful conversation and avoids partial-word matches", () => {
  assert.equal(containsObsceneLanguage("Me encanta conocer lugares nuevos"), false);
  assert.equal(containsObsceneLanguage("Este año quiero aprender"), false);
  assert.equal(containsObsceneLanguage("Qué bonito día"), false);
});

test("free icebreakers return three distinct prompts and cycle through the set", () => {
  const firstRound = getIcebreakers(0);
  const secondRound = getIcebreakers(1);

  assert.equal(firstRound.length, 3);
  assert.equal(new Set(firstRound).size, 3);
  assert.equal(secondRound.length, 3);
  assert.equal(new Set(secondRound).size, 3);
  assert.notDeepEqual(firstRound, secondRound);
});
