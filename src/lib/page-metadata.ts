import type { Metadata } from "next";
import { publicEnv } from "./env.public";
import { baseUrl, buildAlternates, localizedUrl, type SeoLocale } from "./seo";

export function pageMetadata(input: {
  locale: string;
  path: string;
  title?: string;
  description?: string;
  noindex?: boolean;
}): Metadata {
  const locale: SeoLocale = input.locale === "en" ? "en" : "ar";
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  const url = localizedUrl(base, locale, input.path);

  return {
    ...(input.title ? { title: input.title } : {}),
    ...(input.description ? { description: input.description } : {}),
    alternates: buildAlternates(base, locale, input.path),
    openGraph: {
      type: "website",
      siteName: locale === "ar" ? "حلول تك" : "HULOL TECH",
      images: [{ url: `${baseUrl(base)}/icons/icon-192.png`, width: 192, height: 192 }],
      url,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      ...(input.title ? { title: input.title } : {}),
      ...(input.description ? { description: input.description } : {}),
    },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
