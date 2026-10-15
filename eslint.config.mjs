import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // override default ignores of eslint-config-next.
  globalIgnores([
    // default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "android/**",
    "android-web/**",
    "next-env.d.ts",
  ]),
  {
    files: ["tests/**/*.cjs", "tests/**/*.mjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
