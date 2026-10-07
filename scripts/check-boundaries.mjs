import { execSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";

const file = "src/features/leads/domain/boundary-probe.ts";
writeFileSync(
  file,
  'import { infrastructureLayerMarker } from "../infrastructure/marker";\nexport const boundaryProbe = infrastructureLayerMarker;\n',
  "utf8",
);

let rejected = false;
try {
  execSync(`npx eslint "${file}"`, { stdio: "pipe" });
} catch (error) {
  const output = `${error.stdout?.toString() ?? ""}\n${error.stderr?.toString() ?? ""}`;
  rejected = output.includes("boundaries");
  if (!rejected) console.error(output);
} finally {
  rmSync(file, { force: true });
}

if (!rejected) {
  console.error("Boundary rule did not fail when domain imported infrastructure.");
  process.exit(1);
}

console.log("Boundary rule rejects domain -> infrastructure.");
