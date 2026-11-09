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

const { GET, POST } = require("../src/app/api/rectifications/[id]/runs/route.ts");

test("run history is private and cannot be read without a user session", async () => {
  const response = await GET(
    new Request("https://astrared.vip/api/rectifications/00000000-0000-0000-0000-000000000001/runs"),
    { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000001" }) },
  );

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(await response.json(), {
    error: "Inicia sesión para continuar.",
  });
});

test("a rectification run cannot be started without a user session", async () => {
  const response = await POST(
    new Request("https://astrared.vip/api/rectifications/00000000-0000-0000-0000-000000000001/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ techniqueWeights: { transits: 1 } }),
    }),
    { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000001" }) },
  );

  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});
