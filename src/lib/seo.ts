
export const SEO_LOCALES = ["ar", "en"] as const;
export type SeoLocale = (typeof SEO_LOCALES)[number];

/** Indexable pages. Legal pages are left out until the legal review is done. */
export const SITEMAP_PATHS = [
  "/",
  "/services",
  "/services/web",
  "/services/mobile",
  "/services/design",
  "/for/smes",
  "/for/startups",
  "/for/agencies",
  "/for/enterprise",
  "/process",
  "/about",
  "/work",
  "/faq",
  "/contact",
  "/start",
] as const;

export const baseUrl = (raw: string): string => raw.replace(/\/+$/, "");

/** True while NEXT_PUBLIC_SITE_URL is still the example.com placeholder. Search engines must not index that. */
export function isPlaceholderSite(raw: string): boolean {
  try {
    const host = new URL(raw).hostname;
    return host === "example.com" || host.endsWith(".example.com") || host === "localhost";
  } catch {
    return true;
  }
}

export function localizedUrl(base: string, locale: SeoLocale, path: string): string {
  return `${baseUrl(base)}/${locale}${path === "/" ? "" : path}`;
}

/** Canonical URL plus hreflang alternates for both languages and x-default (Arabic). */
export function buildAlternates(base: string, locale: SeoLocale, path: string) {
  return {
    canonical: localizedUrl(base, locale, path),
    languages: {
      ar: localizedUrl(base, "ar", path),
      en: localizedUrl(base, "en", path),
      "x-default": localizedUrl(base, "ar", path),
    },
  };
}
