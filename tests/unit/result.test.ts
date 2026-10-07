import { describe, expect, it } from "vitest";
import { err, isOk, ok } from "@/lib/result";

describe("Result", () => {
  it("returns a success value", () => {
    const result = ok("lead");
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe("lead");
  });

  it("returns a named error", () => {
    const result = err({ code: "invalid" as const });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("invalid");
  });
});
