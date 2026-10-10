import { describe, expect, it } from "vitest";
import { providersToLoad, sanitizeId, type ProviderIds } from "@/lib/analytics/ids";

const ids: ProviderIds = {
  ga4: "G-ABCD1234",
  clarity: "abc123xyz9",
  meta: "123456789012345",
  snap: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  tiktok: "C1A2B3C4D5E6F7G8H9",
};

describe("sanitizeId", () => {
  it("accepts well-formed ids and rejects anything that could break out of a script", () => {
    expect(sanitizeId("ga4", "G-ABCD1234")).toBe("G-ABCD1234");
    expect(sanitizeId("ga4", "G-ABCD1234');alert(1);//")).toBeNull();
    expect(sanitizeId("meta", "12345")).toBeNull();
    expect(sanitizeId("clarity", "")).toBeNull();
    expect(sanitizeId("clarity", undefined)).toBeNull();
  });
});

describe("providersToLoad", () => {
  it("loads nothing before the visitor chooses", () => {
    expect(providersToLoad(null, ids)).toEqual([]);
  });
  it("loads nothing when both choices are off", () => {
    expect(providersToLoad({ analytics: false, marketing: false }, ids)).toEqual([]);
  });
  it("analytics consent loads only GA4 and Clarity", () => {
    expect(providersToLoad({ analytics: true, marketing: false }, ids).map((p) => p.key)).toEqual(["ga4", "clarity"]);
  });
  it("marketing consent loads only the ad pixels", () => {
    expect(providersToLoad({ analytics: false, marketing: true }, ids).map((p) => p.key)).toEqual(["meta", "snap", "tiktok"]);
  });
  it("skips providers whose id is empty or invalid", () => {
    const partial = { ...ids, ga4: "", meta: "not-a-number" };
    expect(providersToLoad({ analytics: true, marketing: true }, partial).map((p) => p.key)).toEqual(["clarity", "snap", "tiktok"]);
  });
});
