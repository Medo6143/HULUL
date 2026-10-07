import { describe, expect, it } from "vitest";
import { parseConsent, serializeConsent } from "@/lib/consent";

describe("consent", () => {
  it("round-trips a choice and rejects a pre-ticked necessary flag that is not true", () => {
    const raw = serializeConsent({
      necessary: true,
      analytics: false,
      marketing: true,
      updatedAt: "2026-10-07T00:00:00.000Z",
    });
    expect(parseConsent(raw)).toEqual({
      necessary: true,
      analytics: false,
      marketing: true,
      updatedAt: "2026-10-07T00:00:00.000Z",
    });
    expect(parseConsent('{"necessary":false,"analytics":true,"marketing":true,"updatedAt":"x"}')).toBeNull();
  });
});
