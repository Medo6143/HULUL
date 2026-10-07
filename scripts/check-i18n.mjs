import { readFileSync } from "node:fs";

function keys(value, prefix = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) return keys(child, next);
    return [next];
  });
}

function diff(left, right) {
  const rightSet = new Set(right);
  const leftSet = new Set(left);
  return {
    missing: left.filter((key) => !rightSet.has(key)),
    extra: right.filter((key) => !leftSet.has(key)),
  };
}

const self = diff(["a", "b"], ["a"]);
if (self.missing.length !== 1 || self.extra.length !== 0) {
  console.error("i18n key diff self-test failed.");
  process.exit(1);
}

const ar = keys(JSON.parse(readFileSync("src/i18n/messages/ar.json", "utf8")));
const en = keys(JSON.parse(readFileSync("src/i18n/messages/en.json", "utf8")));
const result = diff(ar, en);

if (result.missing.length || result.extra.length) {
  console.error("Arabic and English message keys do not match.");
  for (const key of result.missing) console.error(`missing in en: ${key}`);
  for (const key of result.extra) console.error(`missing in ar: ${key}`);
  process.exit(1);
}

console.log(`i18n keys match (${ar.length}).`);
