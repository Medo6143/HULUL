import type { MetadataRoute } from "next";
import { loadCaseStudies } from "@/app/_lib/public-content";
import { SEO_LOCALES, SITEMAP_PATHS, buildAlternates, localizedUrl } from "@/lib/seo";
import { publicEnv } from "@/lib/env.public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const caseStudies = await loadCaseStudies();
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;

  const paths = [...SITEMAP_PATHS, ...caseStudies.map((study) => `/work/${study.slug}`)];

  return paths.flatMap((path) =>
    SEO_LOCALES.map((locale) => ({
      url: localizedUrl(base, locale, path),
      changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "/" ? 1 : path === "/start" ? 0.9 : 0.7,
      alternates: { languages: buildAlternates(base, locale, path).languages },
    })),
  );
}
