export interface Localized {
  ar: string;
  en: string;
}

export interface ServiceConfig {
  slug: "web" | "mobile" | "design";
  /** What the client receives. Empty until the team confirms the real list (MISSING_CONTENT.md). */
  deliverables: readonly Localized[];
  /** Questions specific to this service. Empty means the page shows the general questions instead. */
  faq: readonly { q: Localized; a: Localized }[];
}

export const services: readonly ServiceConfig[] = [
  { slug: "web", deliverables: [], faq: [] },
  { slug: "mobile", deliverables: [], faq: [] },
  { slug: "design", deliverables: [], faq: [] },
];

export type ServiceSlug = ServiceConfig["slug"];

export function isServiceSlug(value: string): value is ServiceSlug {
  return services.some((service) => service.slug === value);
}

export const findService = (slug: string) => services.find((service) => service.slug === slug);
