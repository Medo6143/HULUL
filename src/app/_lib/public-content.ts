import "server-only";
import { unstable_cache } from "next/cache";
import { caseStudies as configCaseStudies } from "@/config/case-studies";
import { testimonials as configTestimonials } from "@/config/testimonials";
import { container } from "@/lib/container";
import type { PublicCaseStudy, PublicTestimonial } from "@/features/showcase";

export const TESTIMONIALS_TAG = "testimonials";
export const CASE_STUDIES_TAG = "case-studies";

const cachedTestimonials = unstable_cache(
  async () => (await container.publishedTestimonials())(),
  ["published-testimonials"],
  { tags: [TESTIMONIALS_TAG], revalidate: 300 },
);

const cachedCaseStudies = unstable_cache(
  async () => (await container.publishedCaseStudies())(),
  ["published-case-studies"],
  { tags: [CASE_STUDIES_TAG], revalidate: 300 },
);

/**
 * Published, consented testimonials. If Firestore is not configured or unreachable we fall back to the static
 * config (empty until content arrives) instead of failing the page; failures are not cached.
 */
export async function loadTestimonials(): Promise<readonly PublicTestimonial[]> {
  try {
    return await cachedTestimonials();
  } catch {
    return configTestimonials;
  }
}

export async function loadCaseStudies(): Promise<readonly PublicCaseStudy[]> {
  try {
    return await cachedCaseStudies();
  } catch {
    return configCaseStudies;
  }
}

export async function loadCaseStudy(slug: string): Promise<PublicCaseStudy | undefined> {
  return (await loadCaseStudies()).find((study) => study.slug === slug);
}
