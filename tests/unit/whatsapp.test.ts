import { describe, expect, it } from "vitest";
import { buildWaLink, contextFromPath, whatsappMessages } from "@/lib/whatsapp";

describe("whatsapp link", () => {
  it("builds the general Arabic message", () => {
    expect(buildWaLink({ phone: "966511111111", locale: "ar", context: "general" })).toBe(
      `https://wa.me/966511111111?text=${encodeURIComponent("هلا، ودّي أحجز استشارة مجانية مع حلول تك.")}`,
    );
  });

  it("builds the enterprise English message", () => {
    expect(buildWaLink({ phone: "+966511111111", locale: "en", context: "enterprise" })).toContain(
      encodeURIComponent("Hello, I would like to arrange a technical meeting for an enterprise project."),
    );
  });

  it("returns null when the official number is not configured", () => {
    expect(buildWaLink({ phone: "", locale: "ar", context: "web" })).toBeNull();
  });

  it("chooses the message from the page path", () => {
    expect(contextFromPath("/ar/services/web")).toBe("web");
    expect(contextFromPath("/en/services/mobile")).toBe("mobile");
    expect(contextFromPath("/ar/services/design")).toBe("design");
    expect(contextFromPath("/ar/for/agencies")).toBe("agency");
    expect(contextFromPath("/en/for/enterprise")).toBe("enterprise");
    expect(contextFromPath("/ar/design-preview")).toBe("general");
  });

  it("keeps prepared messages free of emoji", () => {
    expect(/\p{Extended_Pictographic}/u.test(JSON.stringify(whatsappMessages()))).toBe(false);
  });
});
