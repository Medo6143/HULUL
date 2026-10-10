import { describe, expect, it } from "vitest";
import { signCloudinaryParams } from "@/lib/cloudinary";

describe("Cloudinary signature", () => {
  it("matches Cloudinary's documented example", () => {
    // From the Cloudinary docs: sha1("callback=...&eager=...&public_id=sample_image&timestamp=1315060510" + secret)
    const sig = signCloudinaryParams({ timestamp: 1315060510, public_id: "sample_image", eager: "w_400,h_300,c_pad|w_260,h_200,c_crop" }, "abcd");
    expect(sig).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });
  it("does not depend on the order the parameters are given", () => {
    expect(signCloudinaryParams({ b: 2, a: 1 }, "s")).toBe(signCloudinaryParams({ a: 1, b: 2 }, "s"));
  });
});
