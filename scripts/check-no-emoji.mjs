import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const emoji = /\p{Extended_Pictographic}/u;
const roots = ["src", "scripts"];
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".json", ".md", ".html"]);

function walk(dir, files) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walk(full, files);
      continue;
    }
    if (extensions.has(path.extname(full))) files.push(full);
  }
}

if (!emoji.test("\u{1F600}")) {
  console.error("Emoji detector did not match a pictograph.");
  process.exit(1);
}

if (emoji.test("حلول تك HULOL TECH")) {
  console.error("Emoji detector matched plain text.");
  process.exit(1);
}

const files = [];
for (const root of roots) walk(root, files);

const failures = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (emoji.test(text)) failures.push(file);
}

if (failures.length > 0) {
  console.error("Emoji characters are not allowed:");
  for (const file of failures) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`No emoji in ${files.length} files.`);
