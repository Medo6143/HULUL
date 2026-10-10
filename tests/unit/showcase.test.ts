import { describe, expect, it } from "vitest";
import {
  makeDeleteTestimonial,
  makeGetPublishedCaseStudies,
  makeGetPublishedTestimonials,
  makeSaveCaseStudy,
  makeSaveTestimonial,
  makeSetCaseStudyPublished,
  makeSetTestimonialPublished,
  type CaseStudyInput,
  type TestimonialInput,
} from "@/features/showcase";
import { InMemoryCaseStudyStore, InMemoryTestimonialStore } from "@/features/showcase/infrastructure/in-memory-showcase.store";

const NOW = new Date("2026-10-10T08:00:00Z");
const clock = { now: () => NOW };
const counter = () => {
  let n = 0;
  return { next: () => `t${++n}` };
};

const testimonial = (over: Partial<TestimonialInput> = {}): TestimonialInput => ({
  quote: { ar: "خدمة ممتازة", en: "" },
  name: { ar: "عميل", en: "" },
  role: { ar: "مدير", en: "" },
  company: "شركة",
  city: "",
  consentToPublish: true,
  consentNote: "رسالة واتساب",
  published: true,
  order: 0,
  ...over,
});

const study = (over: Partial<CaseStudyInput> = {}): CaseStudyInput => ({
  slug: "shop-app",
  category: "web",
  title: { ar: "متجر", en: "Shop" },
  result: { ar: "نتيجة موثقة", en: "" },
  problem: { ar: "تحدي", en: "" },
  solution: { ar: "حل", en: "" },
  clientName: "شركة س",
  clientNameConsent: true,
  consentToPublish: true,
  consentNote: "بريد إلكتروني",
  published: true,
  order: 0,
  ...over,
});

describe("testimonials and consent", () => {
  it("refuses to publish without consent, and requires a consent note", async () => {
    const store = new InMemoryTestimonialStore();
    const save = makeSaveTestimonial({ store, ids: counter(), clock });
    expect(await save({ input: testimonial({ consentToPublish: false }) })).toMatchObject({ ok: false, error: { code: "consent_required" } });
    expect(await save({ input: testimonial({ consentNote: "  " }) })).toMatchObject({ ok: false, error: { code: "consent_note_required" } });
    expect(await store.list()).toHaveLength(0);
  });
  it("requires Arabic quote and name", async () => {
    const save = makeSaveTestimonial({ store: new InMemoryTestimonialStore(), ids: counter(), clock });
    expect(await save({ input: testimonial({ quote: { ar: " ", en: "x" } }) })).toMatchObject({ ok: false, error: { code: "invalid_input" } });
  });
  it("shows only published and consented items, falling back to Arabic for English", async () => {
    const store = new InMemoryTestimonialStore();
    const save = makeSaveTestimonial({ store, ids: counter(), clock });
    await save({ input: testimonial({ order: 2 }) });
    await save({ input: testimonial({ published: false, name: { ar: "مسودة", en: "" } }) });
    await save({ input: testimonial({ consentToPublish: false, published: false, name: { ar: "بدون موافقة", en: "" } }) });
    const shown = await makeGetPublishedTestimonials({ store })();
    expect(shown).toHaveLength(1);
    expect(shown[0]?.quote.en).toBe("خدمة ممتازة");
    expect(shown[0]?.role.ar).toBe("مدير - شركة");
  });
  it("hides an item when consent is revoked, even if it was published", async () => {
    const store = new InMemoryTestimonialStore();
    const save = makeSaveTestimonial({ store, ids: counter(), clock });
    const created = await save({ input: testimonial() });
    const id = created.ok ? created.value.id : "";
    expect(await makeGetPublishedTestimonials({ store })()).toHaveLength(1);
    await save({ id, input: testimonial({ consentToPublish: false, published: false }) });
    expect(await makeGetPublishedTestimonials({ store })()).toHaveLength(0);
    const saved = await store.get(id);
    expect(saved?.consentDate).toBeNull();
  });
  it("keeps the first consent date when edited, and publish toggles respect consent", async () => {
    const store = new InMemoryTestimonialStore();
    const save = makeSaveTestimonial({ store, ids: counter(), clock });
    const created = await save({ input: testimonial({ published: false }) });
    const id = created.ok ? created.value.id : "";
    const later = makeSaveTestimonial({ store, ids: counter(), clock: { now: () => new Date("2027-01-01T00:00:00Z") } });
    await later({ id, input: testimonial({ published: false, order: 5 }) });
    expect((await store.get(id))?.consentDate).toBe(NOW.toISOString());
    const publish = makeSetTestimonialPublished({ store, clock });
    expect((await publish({ id, published: true })).ok).toBe(true);
    await save({ id, input: testimonial({ consentToPublish: false, published: false }) });
    expect(await publish({ id, published: true })).toMatchObject({ ok: false, error: { code: "consent_required" } });
    expect(await publish({ id: "nope", published: true })).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
  it("deletes only existing items", async () => {
    const store = new InMemoryTestimonialStore();
    const created = await makeSaveTestimonial({ store, ids: counter(), clock })({ input: testimonial() });
    const remove = makeDeleteTestimonial({ store });
    expect((await remove(created.ok ? created.value.id : "")).ok).toBe(true);
    expect(await remove("gone")).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
});

describe("case studies", () => {
  it("lowercases the slug and rejects bad slugs and categories", async () => {
    const save = makeSaveCaseStudy({ store: new InMemoryCaseStudyStore(), clock });
    expect(await save({ create: true, input: study({ slug: "bad slug" }) })).toMatchObject({ ok: false, error: { code: "invalid_slug" } });
    expect(await save({ create: true, input: study({ slug: "x" }) })).toMatchObject({ ok: false, error: { code: "invalid_slug" } });
    expect(await save({ create: true, input: study({ category: "other" }) })).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(await save({ create: true, input: study({ problem: { ar: "", en: "x" } }) })).toMatchObject({ ok: false, error: { code: "invalid_input" } });
  });
  it("does not overwrite on create and does not invent on update", async () => {
    const save = makeSaveCaseStudy({ store: new InMemoryCaseStudyStore(), clock });
    expect((await save({ create: true, input: study() })).ok).toBe(true);
    expect(await save({ create: true, input: study() })).toMatchObject({ ok: false, error: { code: "slug_exists" } });
    expect(await save({ create: false, input: study({ slug: "other-one" }) })).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
  it("shows the client name only with its own consent", async () => {
    const store = new InMemoryCaseStudyStore();
    const save = makeSaveCaseStudy({ store, clock });
    await save({ create: true, input: study() });
    await save({ create: true, input: study({ slug: "anon-case", clientNameConsent: false }) });
    const shown = await makeGetPublishedCaseStudies({ store })();
    expect(shown.find((s) => s.slug === "shop-app")?.clientName).toBe("شركة س");
    expect(shown.find((s) => s.slug === "anon-case")).not.toHaveProperty("clientName");
  });
  it("never exposes the consent note or internal fields publicly", async () => {
    const store = new InMemoryCaseStudyStore();
    await makeSaveCaseStudy({ store, clock })({ create: true, input: study() });
    const [shown] = await makeGetPublishedCaseStudies({ store })();
    expect(JSON.stringify(shown)).not.toContain("بريد إلكتروني");
    expect(shown).not.toHaveProperty("consentNote");
  });
  it("hides unpublished studies and refuses to publish without consent", async () => {
    const store = new InMemoryCaseStudyStore();
    const save = makeSaveCaseStudy({ store, clock });
    await save({ create: true, input: study({ published: false }) });
    expect(await makeGetPublishedCaseStudies({ store })()).toHaveLength(0);
    const publish = makeSetCaseStudyPublished({ store, clock });
    expect((await publish({ slug: "shop-app", published: true })).ok).toBe(true);
    await save({ create: false, input: study({ consentToPublish: false, published: false }) });
    expect(await publish({ slug: "shop-app", published: true })).toMatchObject({ ok: false, error: { code: "consent_required" } });
    expect(await makeGetPublishedCaseStudies({ store })()).toHaveLength(0);
  });
});
