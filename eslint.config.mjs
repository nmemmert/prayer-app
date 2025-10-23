import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Additional ignores for generated/config files:
    "public/sw.js",
    "public/workbox-*.js",
    "public/firebase-messaging-sw.js",
    "jest.config.js",
    "jest.setup.js",
    "next-i18next.config.js",
    "next.config.ts",
    "src/dataconnect-generated/**",
  ]),
]);

export default eslintConfig;
