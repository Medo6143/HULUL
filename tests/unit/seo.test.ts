import { describe, expect, it } from "vitest";
import { SITEMAP_PATHS, baseUrl, buildAlternates, isPlaceholderSite, localizedUrl } from "@/lib/seo";
import { faqSchema, organizationSchema, serviceSchema } from "@/lib/structured-data";

describe("seo helpers", () => {
  it("builds localized URLs without trailing or double slashes", () => {
    expect(baseUrl("https://hulol.example/")).toBe("https://hulol.example");
    expect(localizedUrl("https://hulol.example/", "ar", "/")).toBe("https://hulol.example/ar");
    expect(localizedUrl("https://hulol.example", "en", "/services/web")).toBe("https://hulol.example/en/services/web");
  });
  it("gives each page a canonical and both hreflang alternates, with Arabic as x-default", () => {
    const a = buildAlternates("https://hulol.example", "en", "/about");
    expect(a.canonical).toBe("https://hulol.example/en/about");
    expect(a.languages).toEqual({
      ar: "https://hulol.example/ar/about",
      en: "https://hulol.example/en/about",
      "x-default": "https://hulol.example/ar/about",
    });
  });
  it("treats example.com, localhost, and bad values as placeholder sites", () => {
    expect(isPlaceholderSite("https://example.com")).toBe(true);
    expect(isPlaceholderSite("http://localhost:3000")).toBe(true);
    expect(isPlaceholderSite("not a url")).toBe(true);
    expect(isPlaceholderSite("https://hulol.sa")).toBe(false);
  });
  it("keeps admin, api, and legal pages out of the sitemap", () => {
    for (const path of SITEMAP_PATHS) {
      expect(path).not.toMatch(/^\/(admin|api|privacy|terms|cookies)/);
    }
    expect(SITEMAP_PATHS).toContain("/start");
  });
});

describe("structured data", () => {
  it("describes the organization with confirmed facts only", () => {
    const org = organizationSchema({ base: "https://hulol.example", name: "HULOL TECH" });
    expect(org["@type"]).toBe("Organization");
    expect(org.address.addressLocality).toBe("Riyadh");
    expect(JSON.stringify(org)).not.toMatch(/telephone|email|aggregateRating|review/i);
  });
  it("builds FAQ and service schemas", () => {
    const faq = faqSchema([{ question: "Q?", answer: "A." }]);
    expect(faq.mainEntity[0]?.acceptedAnswer.text).toBe("A.");
    const svc = serviceSchema({
      base: "https://hulol.example",
      locale: "ar",
      path: "/services/web",
      name: "Web",
      description: "d",
      providerName: "HULOL TECH",
    });
    expect(svc.url).toBe("https://hulol.example/ar/services/web");
    expect(svc.areaServed.name).toBe("Saudi Arabia");
  });
});
