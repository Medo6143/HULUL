// Pure domain: customer testimonials and case studies, and the consent rule that gates publishing.
// Nothing is public without a recorded consent; revoking consent hides the item.

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export interface Localized {
  ar: string;
  en: string;
}

export const CASE_CATEGORIES = ["web", "mobile", "design"] as const;
export type CaseCategory = (typeof CASE_CATEGORIES)[number];

export type ShowcaseError =
  | { code: "invalid_input" }
  | { code: "invalid_slug" }
  | { code: "invalid_image" }
  | { code: "slug_exists" }
  | { code: "consent_required" }
  | { code: "consent_note_required" }
  | { code: "not_found" };

export interface Consent {
  consentToPublish: boolean;
  /** Where and how the written consent was given (for the record, never shown publicly). */
  consentNote: string;
  /** ISO time the consent was first recorded; null while there is no consent. */
  consentDate: string | null;
}

/** A project image hosted on Cloudinary. Only Cloudinary delivery URLs are accepted. */
export interface CaseImage {
  url: string;
  alt: Localized;
}

export const MAX_CASE_IMAGES = 8;
const IMAGE_URL_RE = /^https:\/\/res\.cloudinary\.com\/[A-Za-z0-9_-]+\/image\/upload\/[^\s"'<>]+$/;
export const isCloudinaryImageUrl = (url: string) => url.length <= 500 && IMAGE_URL_RE.test(url);

export interface Testimonial extends Consent {
  id: string;
  quote: Localized;
  name: Localized;
  role: Localized;
  company: string;
  city: string;
  published: boolean;
  order: number;
  updatedAt: string;
}

export interface CaseStudy extends Consent {
  slug: string;
  category: CaseCategory;
  title: Localized;
  /** The measurable result with its real, documented number. */
  result: Localized;
  problem: Localized;
  solution: Localized;
  clientName: string;
  /** Separate consent: the client's name appears only when this is true as well. */
  clientNameConsent: boolean;
  /** The first image is the cover. */
  images: CaseImage[];
  published: boolean;
  order: number;
  updatedAt: string;
}

export interface TestimonialInput {
  quote: Localized;
  name: Localized;
  role: Localized;
  company: string;
  city: string;
  consentToPublish: boolean;
  consentNote: string;
  published: boolean;
  order: number;
}

export interface CaseStudyInput {
  slug: string;
  category: string;
  title: Localized;
  result: Localized;
  problem: Localized;
  solution: Localized;
  clientName: string;
  clientNameConsent: boolean;
  images: CaseImage[];
  consentToPublish: boolean;
  consentNote: string;
  published: boolean;
  order: number;
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const clean = (value: string, max: number) => value.trim().slice(0, max);
const localized = (value: Localized, max: number): Localized => ({ ar: clean(value.ar, max), en: clean(value.en, max) });
const order = (value: number) => (Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 0), 9999) : 0);

export const isCaseCategory = (value: unknown): value is CaseCategory =>
  typeof value === "string" && (CASE_CATEGORIES as readonly string[]).includes(value);

export const isValidSlug = (slug: string) => slug.length >= 2 && slug.length <= 60 && SLUG_RE.test(slug);

/** Shared consent rules. Publishing needs consent plus a note saying how it was obtained. */
function checkConsent(
  input: { consentToPublish: boolean; consentNote: string; published: boolean },
  existing: Consent | null,
  now: Date,
): Result<Consent & { published: boolean }, ShowcaseError> {
  const note = clean(input.consentNote, 500);
  if (input.published && !input.consentToPublish) return err({ code: "consent_required" });
  if (input.consentToPublish && note.length === 0) return err({ code: "consent_note_required" });
  const consentDate = input.consentToPublish ? (existing?.consentDate ?? now.toISOString()) : null;
  return ok({ consentToPublish: input.consentToPublish, consentNote: note, consentDate, published: input.published });
}

export function buildTestimonial(
  input: TestimonialInput,
  meta: { id: string; existing: Testimonial | null; now: Date },
): Result<Testimonial, ShowcaseError> {
  const quote = localized(input.quote, 600);
  const name = localized(input.name, 100);
  if (!quote.ar || !name.ar) return err({ code: "invalid_input" });
  const consent = checkConsent(input, meta.existing, meta.now);
  if (!consent.ok) return consent;
  return ok({
    id: meta.id,
    quote,
    name,
    role: localized(input.role, 100),
    company: clean(input.company, 100),
    city: clean(input.city, 60),
    ...consent.value,
    order: order(input.order),
    updatedAt: meta.now.toISOString(),
  });
}

export function buildCaseStudy(
  input: CaseStudyInput,
  meta: { existing: CaseStudy | null; now: Date },
): Result<CaseStudy, ShowcaseError> {
  const slug = input.slug.trim().toLowerCase();
  if (!isValidSlug(slug)) return err({ code: "invalid_slug" });
  if (!isCaseCategory(input.category)) return err({ code: "invalid_input" });
  const title = localized(input.title, 140);
  const result = localized(input.result, 400);
  const problem = localized(input.problem, 3000);
  const solution = localized(input.solution, 3000);
  if (!title.ar || !result.ar || !problem.ar || !solution.ar) return err({ code: "invalid_input" });
  if (input.images.length > MAX_CASE_IMAGES || !input.images.every((image) => isCloudinaryImageUrl(image.url))) {
    return err({ code: "invalid_image" });
  }
  const consent = checkConsent(input, meta.existing, meta.now);
  if (!consent.ok) return consent;
  const clientName = clean(input.clientName, 100);
  return ok({
    slug,
    category: input.category,
    title,
    result,
    problem,
    solution,
    clientName,
    images: input.images.map((image) => ({ url: image.url, alt: localized(image.alt, 150) })),
    clientNameConsent: input.clientNameConsent && clientName.length > 0 && consent.value.consentToPublish,
    ...consent.value,
    order: order(input.order),
    updatedAt: meta.now.toISOString(),
  });
}

/** Turns a publish request into the new `published` value, or refuses it without consent. */
export function checkPublish(item: Consent, published: boolean): Result<boolean, ShowcaseError> {
  if (published && !item.consentToPublish) return err({ code: "consent_required" });
  return ok(published);
}

export const isPublic = (item: Consent & { published: boolean }) => item.published && item.consentToPublish;

// ---- public projections (what the website may show) ----

const pick = (value: Localized): Localized => ({ ar: value.ar, en: value.en || value.ar });

export interface PublicTestimonial {
  id: string;
  quote: Localized;
  name: Localized;
  role: Localized;
}

export interface PublicCaseStudy {
  slug: string;
  category: CaseCategory;
  title: Localized;
  result: Localized;
  problem: Localized;
  solution: Localized;
  images: CaseImage[];
  /** Present only with the separate client-name consent. */
  clientName?: string;
}

export function toPublicTestimonial(item: Testimonial): PublicTestimonial | null {
  if (!isPublic(item)) return null;
  const role = pick(item.role);
  const company = item.company;
  const withCompany = (r: string) => [r, company].filter(Boolean).join(" - ");
  return {
    id: item.id,
    quote: pick(item.quote),
    name: pick(item.name),
    role: { ar: withCompany(role.ar), en: withCompany(role.en) },
  };
}

export function toPublicCaseStudy(item: CaseStudy): PublicCaseStudy | null {
  if (!isPublic(item)) return null;
  return {
    slug: item.slug,
    category: item.category,
    title: pick(item.title),
    result: pick(item.result),
    problem: pick(item.problem),
    solution: pick(item.solution),
    images: (item.images ?? []).map((image) => ({ url: image.url, alt: pick(image.alt) })),
    ...(item.clientNameConsent && item.clientName ? { clientName: item.clientName } : {}),
  };
}

export const byOrder = <T extends { order: number }>(items: readonly T[]): T[] =>
  [...items].sort((a, b) => a.order - b.order);
