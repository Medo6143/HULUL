import { describe, expect, it } from "vitest";
import { makeRateLimiter } from "@/lib/rate-limit";

describe("makeRateLimiter", () => {
  it("blocks after the limit and resets after the window", () => {
    let t = 0;
    const allow = makeRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect(allow("a")).toBe(true);
    expect(allow("a")).toBe(true);
    expect(allow("a")).toBe(false);
    expect(allow("b")).toBe(true);
    t = 1001;
    expect(allow("a")).toBe(true);
  });
});
