import { execSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const LINE = /(?:^|[\s"'`])((?:ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br)-[\w[\]/.%:-]+)/;
const BARE = /(?:^|[\s"'`])(text-left|text-right|float-left|float-right)(?=$|[\s"'`])/;
const CSS = /(?:^|[;{}])\s*(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/;

function walk(dir, files) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (full.endsWith(".css")) files.push(full);
  }
}

const cssFiles = [];
walk("src", cssFiles);
for (const file of cssFiles) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.includes("physical-direction-ok")) return;
    const match = line.match(LINE)?.[1] ?? line.match(BARE)?.[1] ?? line.match(CSS)?.[1];
    if (match) {
      console.error(`${file}:${index + 1} physical direction ${match}`);
      process.exit(1);
    }
  });
}

const file = "src/components/ui/physical-direction-probe.tsx";
writeFileSync(file, 'export const probe = "ml-4";\n', "utf8");

let rejected = false;
try {
  execSync(`npx eslint "${file}"`, { stdio: "pipe" });
} catch (error) {
  const output = `${error.stdout?.toString() ?? ""}\n${error.stderr?.toString() ?? ""}`;
  rejected = output.includes("Physical direction");
  if (!rejected) console.error(output);
} finally {
  rmSync(file, { force: true });
}

if (!rejected) {
  console.error("Physical direction rule did not fail on ml-4.");
  process.exit(1);
}

console.log("Physical direction rule rejects ml-4.");
