import {
  buildCaseStudy,
  buildTestimonial,
  byOrder,
  checkPublish,
  toPublicCaseStudy,
  toPublicTestimonial,
  type CaseStudy,
  type CaseStudyInput,
  type PublicCaseStudy,
  type PublicTestimonial,
  type Result,
  type ShowcaseError,
  type Testimonial,
  type TestimonialInput,
} from "../domain/showcase";
import type { CaseStudyStore, Clock, IdGenerator, TestimonialStore } from "./ports";

const fail = (code: ShowcaseError["code"]): Result<never, ShowcaseError> => ({ ok: false, error: { code } });

// ---- testimonials ----

export function makeListTestimonials(deps: { store: TestimonialStore }) {
  return async () => byOrder(await deps.store.list());
}

/** Creates (no `id`) or updates a testimonial. Consent is checked here, not in the browser. */
export function makeSaveTestimonial(deps: { store: TestimonialStore; ids: IdGenerator; clock: Clock }) {
  return async function save(req: { id?: string; input: TestimonialInput }): Promise<Result<Testimonial, ShowcaseError>> {
    const existing = req.id ? await deps.store.get(req.id) : null;
    if (req.id && !existing) return fail("not_found");
    const built = buildTestimonial(req.input, { id: req.id ?? deps.ids.next(), existing, now: deps.clock.now() });
    if (!built.ok) return built;
    await deps.store.save(built.value);
    return built;
  };
}

export function makeSetTestimonialPublished(deps: { store: TestimonialStore; clock: Clock }) {
  return async function setPublished(req: { id: string; published: boolean }): Promise<Result<Testimonial, ShowcaseError>> {
    const item = await deps.store.get(req.id);
    if (!item) return fail("not_found");
    const published = checkPublish(item, req.published);
    if (!published.ok) return published;
    const next = { ...item, published: published.value, updatedAt: deps.clock.now().toISOString() };
    await deps.store.save(next);
    return { ok: true, value: next };
  };
}

export function makeDeleteTestimonial(deps: { store: TestimonialStore }) {
  return async function remove(id: string): Promise<Result<true, ShowcaseError>> {
    if (!(await deps.store.get(id))) return fail("not_found");
    await deps.store.delete(id);
    return { ok: true, value: true };
  };
}

/** What the website shows: published AND consented, in order. Applied again here on top of the rules. */
export function makeGetPublishedTestimonials(deps: { store: TestimonialStore }) {
  return async function getPublished(): Promise<PublicTestimonial[]> {
    return byOrder(await deps.store.list()).flatMap((item) => toPublicTestimonial(item) ?? []);
  };
}

// ---- case studies ----

export function makeListCaseStudies(deps: { store: CaseStudyStore }) {
  return async () => byOrder(await deps.store.list());
}

export function makeSaveCaseStudy(deps: { store: CaseStudyStore; clock: Clock }) {
  return async function save(req: { create: boolean; input: CaseStudyInput }): Promise<Result<CaseStudy, ShowcaseError>> {
    const slug = req.input.slug.trim().toLowerCase();
    const existing = await deps.store.get(slug);
    if (req.create && existing) return fail("slug_exists");
    if (!req.create && !existing) return fail("not_found");
    const built = buildCaseStudy({ ...req.input, slug }, { existing, now: deps.clock.now() });
    if (!built.ok) return built;
    await deps.store.save(built.value);
    return built;
  };
}

export function makeSetCaseStudyPublished(deps: { store: CaseStudyStore; clock: Clock }) {
  return async function setPublished(req: { slug: string; published: boolean }): Promise<Result<CaseStudy, ShowcaseError>> {
    const item = await deps.store.get(req.slug);
    if (!item) return fail("not_found");
    const published = checkPublish(item, req.published);
    if (!published.ok) return published;
    const next = { ...item, published: published.value, updatedAt: deps.clock.now().toISOString() };
    await deps.store.save(next);
    return { ok: true, value: next };
  };
}

export function makeDeleteCaseStudy(deps: { store: CaseStudyStore }) {
  return async function remove(slug: string): Promise<Result<true, ShowcaseError>> {
    if (!(await deps.store.get(slug))) return fail("not_found");
    await deps.store.delete(slug);
    return { ok: true, value: true };
  };
}

export function makeGetPublishedCaseStudies(deps: { store: CaseStudyStore }) {
  return async function getPublished(): Promise<PublicCaseStudy[]> {
    return byOrder(await deps.store.list()).flatMap((item) => toPublicCaseStudy(item) ?? []);
  };
}
