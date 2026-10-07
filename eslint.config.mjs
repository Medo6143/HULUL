import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import noPhysicalDirection from "./eslint/rules/no-physical-direction.mjs";

const layerElements = [
  { type: "domain", pattern: "src/features/*/domain/**" },
  { type: "application", pattern: "src/features/*/application/**" },
  { type: "infrastructure", pattern: "src/features/*/infrastructure/**" },
  { type: "featureUi", pattern: "src/features/*/ui/**" },
  { type: "featurePublic", pattern: "src/features/*/index.ts" },
  { type: "app", pattern: "src/app/**" },
  { type: "components", pattern: "src/components/**" },
  { type: "firebase", pattern: "src/lib/firebase/**" },
  { type: "container", pattern: "src/lib/container.ts", mode: "file" },
  { type: "lib", pattern: "src/lib/**" },
  { type: "config", pattern: "src/config/**" },
  { type: "i18n", pattern: "src/i18n/**" },
  { type: "fonts", pattern: "src/fonts/**" },
  { type: "middleware", pattern: "src/proxy.ts" },
];

const boundaryRules = {
  default: "disallow",
  rules: [
    { from: ["domain"], allow: [] },
    { from: ["application"], allow: ["domain"] },
    { from: ["infrastructure"], allow: ["domain", "application", "lib", "firebase"] },
    {
      from: ["featureUi"],
      allow: ["domain", "application", "featurePublic", "components", "lib", "i18n", "config"],
    },
    { from: ["featurePublic"], allow: ["domain", "application", "featureUi"] },
    {
      from: ["app"],
      allow: ["featurePublic", "components", "container", "lib", "i18n", "config", "fonts"],
    },
    { from: ["components"], allow: ["components", "lib", "i18n", "config"] },
    {
      from: ["container"],
      allow: ["lib", "firebase", "infrastructure", "application", "domain", "config"],
    },
    { from: ["firebase"], allow: ["lib"] },
    { from: ["lib"], allow: ["lib", "config"] },
    { from: ["config"], allow: ["config"] },
    { from: ["i18n"], allow: ["i18n"] },
    { from: ["fonts"], allow: [] },
    { from: ["middleware"], allow: ["i18n"] },
  ],
};

const config = [
  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.ts", "tailwind.config.ts", "playwright.config.ts", "vitest.config.ts"],
    plugins: {
      hulol: { rules: { "no-physical-direction": noPhysicalDirection } },
    },
    rules: {
      "hulol/no-physical-direction": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/elements": layerElements,
      "boundaries/include": ["src/**/*"],
    },
    rules: {
      "boundaries/element-types": ["error", boundaryRules],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/firebase/**", "src/lib/container.ts", "src/features/**/infrastructure/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["firebase", "firebase/*", "firebase-admin", "firebase-admin/*"],
              message: "Import Firebase only from infrastructure, lib/firebase, or functions.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/**/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ["react", "react-dom", "next", "zod", "firebase", "firebase-admin", "next-intl"],
          patterns: [
            {
              group: ["react/*", "next/*", "firebase/*", "firebase-admin/*", "next-intl/*", "zod/*"],
              message: "Domain code stays pure TypeScript.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      "pack/**",
      "node_modules/**",
      ".next/**",
      "public/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "scripts/**",
    ],
  },
];

export default config;
