import { describe, expect, it } from "vitest";
import { TBD, legalSections, type LegalKind } from "@/config/legal";
import { siteConfig } from "@/config/site";
import { SITEMAP_PATHS } from "@/lib/seo";

const KINDS: LegalKind[] = ["privacy", "terms", "cookies"];

describe("legal drafts", () => {
  it("have the same structure in Arabic and English", () => {
    for (const kind of KINDS) {
      const ar = legalSections(kind, "ar");
      const en = legalSections(kind, "en");
      expect(ar.length).toBe(en.length);
      ar.forEach((section, i) => {
        expect(section.items?.length ?? 0).toBe(en[i]?.items?.length ?? 0);
        expect(section.paragraphs?.length ?? 0).toBe(en[i]?.paragraphs?.length ?? 0);
      });
    }
  });
  it("show a visible placeholder for every fact that was not supplied, and never invent one", () => {
    expect(siteConfig.crNumber).toBeNull();
    for (const locale of ["ar", "en"] as const) {
      const text = JSON.stringify(legalSections("privacy", locale));
      expect(text).toContain(TBD[locale]);
      expect(text).not.toMatch(/\d{10}/); // no registration or phone numbers
    }
    expect(JSON.stringify(legalSections("terms", "ar"))).toContain(TBD.ar);
  });
  it("contain no emoji and no unconfirmed promises", () => {
    for (const kind of KINDS) {
      for (const locale of ["ar", "en"] as const) {
        const text = JSON.stringify(legalSections(kind, locale));
        expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
        expect(text).not.toMatch(/خلال\s+\d+\s+(ساعة|يوم|أيام)|within\s+\d+\s+(hours?|days?)/i);
      }
    }
  });
  it("name the providers the site really uses", () => {
    const text = JSON.stringify(legalSections("privacy", "en"));
    for (const name of ["Firebase", "reCAPTCHA", "Resend", "Vercel", "Cloudinary", "Google Analytics", "Clarity"]) {
      expect(text).toContain(name);
    }
  });
  it("keeps legal pages out of the sitemap while listing the new public pages", () => {
    for (const path of ["/privacy", "/terms", "/cookies"]) expect(SITEMAP_PATHS).not.toContain(path);
    expect(SITEMAP_PATHS).toContain("/faq");
    expect(SITEMAP_PATHS).toContain("/contact");
  });
});
