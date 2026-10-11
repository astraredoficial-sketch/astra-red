const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

require.extensions[".ts"] = function (mod, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  mod._compile(compiled.outputText, filename);
};

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    request = path.join(process.cwd(), "src", request.slice(2));
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const { computeNatalChart } = require("../src/lib/astro/chart.ts");

const chart = computeNatalChart({
  date: "2000-01-01",
  time: "12:00",
  cityId: "us-nyc",
  timeUnknown: false,
});

console.log("CASO DE REFERENCIA: 2000-01-01, 12:00, Nueva York");
console.log("Hora local conocida; zona America/New_York");
console.log("Día juliano:", chart.julianDay.toFixed(6));
console.log("\nPOSICIONES ECLÍPTICAS");
for (const p of chart.planets) {
  console.log(
    `${p.id.padEnd(8)} longitud=${p.longitude.toFixed(6)}°  signo=${p.sign}  casa=${p.house}`
  );
}
console.log("\nCÚSPIDES ACTUALES");
chart.houses.forEach((h, i) =>
  console.log(`Casa ${(i + 1).toString().padStart(2)}: ${h.toFixed(6)}°`)
);
