import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// `process.env` is empty in the browser, so the validated env objects throw there. Client files must read
// NEXT_PUBLIC_* variables directly by name instead.
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe("client components and env", () => {
  it("no 'use client' file imports the validated env modules", () => {
    const offenders = sourceFiles("src").filter((file) => {
      const text = readFileSync(file, "utf8");
      const isClient = /^\s*(\/\/.*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(text);
      return isClient && /from\s+["'][^"']*(env\.public|env\.server|env-schema)["']/.test(text);
    });
    expect(offenders).toEqual([]);
  });
});
