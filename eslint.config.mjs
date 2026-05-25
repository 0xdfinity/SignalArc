import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "artifacts/**",
    "cache/**",
    "hardhat.config.cjs",
    "scripts/**/*.cjs",
    "test/**/*.cjs",
    "supabase/functions/**",
    "next-env.d.ts",
  ]),
]);
