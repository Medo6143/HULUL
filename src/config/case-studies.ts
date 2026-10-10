// Real case studies only, each with the client's written permission and a measurable result.
// Empty until the content arrives (see MISSING_CONTENT.md). While empty, the home section and the work
// pages stay empty and /work/[slug] answers 404.
export interface Localized {
  ar: string;
  en: string;
}

export interface CaseStudy {
  slug: string;
  category: "web" | "mobile" | "design";
  title: Localized;
  /** The measurable result, with its real number. */
  result: Localized;
  problem: Localized;
  solution: Localized;
  images: { url: string; alt: Localized }[];
}

export const caseStudies: readonly CaseStudy[] = [];

export const findCaseStudy = (slug: string) => caseStudies.find((study) => study.slug === slug);
