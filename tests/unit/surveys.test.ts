import { describe, expect, it } from "vitest";
import {
  averageRating,
  buildSurveyMessage,
  makeConvertSurvey,
  makeCreateSurvey,
  makeDeleteSurvey,
  makeGetSurveyForPage,
  makeListSurveys,
  makeSendSurveyEmail,
  makeSubmitSurvey,
  toSurveyEmail,
  type TestimonialDraft,
} from "@/features/surveys";
import { InMemorySurveyStore } from "@/features/surveys/infrastructure/in-memory-survey.store";

const NOW = new Date("2026-10-15T09:00:00Z");

function world() {
  const store = new InMemorySurveyStore();
  const clock = { now: () => NOW };
  let n = 0;
  const ids = { next: () => `s${++n}` };
  let t = 0;
  const newToken = () => `token-${String(++t).padStart(20, "0")}`;
  const projects = { titleOf: async (slug: string) => (slug === "smart-clinic" ? { ar: "Smart Clinic", en: "Smart Clinic" } : null) };
  const drafts: TestimonialDraft[] = [];
  const testimonials = { create: async (d: TestimonialDraft) => (drafts.push(d), { ok: true as const, id: `t${drafts.length}` }) };
  const create = makeCreateSurvey({ store, projects, clock, ids, newToken });
  return { store, clock, create, drafts, testimonials };
}

const input = { projectSlug: "smart-clinic", clientName: "سارة", clientPhone: "0501234567", clientEmail: "S@Example.com", locale: "ar" as const };
const answer = { rating: 5, comment: "تجربة ممتازة وتعامل راقي", name: "", role: "مديرة", allowPublish: true };

describe("creating a survey", () => {
  it("uses the real project title, normalizes contact details, and starts as sent", async () => {
    const { create, store } = world();
    const r = await create({ input, by: "owner" });
    expect(r.ok).toBe(true);
    const saved = (await store.list())[0]!;
    expect(saved).toMatchObject({ projectTitle: { ar: "Smart Clinic" }, clientPhone: "966501234567", clientEmail: "s@example.com", status: "sent", response: null });
    expect(saved.token.length).toBeGreaterThanOrEqual(16);
  });
  it("accepts a typed project title when no project is chosen, and rejects bad input", async () => {
    const { create } = world();
    expect((await create({ input: { ...input, projectSlug: "", projectTitle: { ar: "مشروع خاص", en: "" } }, by: "o" })).ok).toBe(true);
    expect(await create({ input: { ...input, projectSlug: "", projectTitle: { ar: "", en: "" } }, by: "o" })).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(await create({ input: { ...input, clientName: "x" }, by: "o" })).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(await create({ input: { ...input, clientPhone: "12" }, by: "o" })).toMatchObject({ ok: false, error: { code: "invalid_phone" } });
    expect(await create({ input: { ...input, clientEmail: "nope" }, by: "o" })).toMatchObject({ ok: false, error: { code: "invalid_email" } });
  });
});

describe("the public page and the answer", () => {
  it("shows only the project and first name, and nothing for an unknown or short token", async () => {
    const { create, store } = world();
    await create({ input, by: "o" });
    const token = (await store.list())[0]!.token;
    const page = await makeGetSurveyForPage({ store })(token);
    expect(page).toEqual({ projectTitle: { ar: "Smart Clinic", en: "Smart Clinic" }, clientName: "سارة", locale: "ar", answered: false });
    expect(JSON.stringify(page)).not.toContain("966501234567");
    expect(await makeGetSurveyForPage({ store })("short")).toBeNull();
    expect(await makeGetSurveyForPage({ store })("x".repeat(30))).toBeNull();
  });
  it("accepts one valid answer and refuses a second", async () => {
    const { create, store, clock } = world();
    await create({ input, by: "o" });
    const token = (await store.list())[0]!.token;
    const submit = makeSubmitSurvey({ store, clock });
    expect((await submit({ token, answer })).ok).toBe(true);
    const saved = (await store.list())[0]!;
    expect(saved.status).toBe("answered");
    expect(saved.response).toMatchObject({ rating: 5, name: "سارة", allowPublish: true });
    expect(await submit({ token, answer })).toMatchObject({ ok: false, error: { code: "already_answered" } });
  });
  it("rejects a bad rating, an empty comment, and an unknown token", async () => {
    const { create, store, clock } = world();
    await create({ input, by: "o" });
    const token = (await store.list())[0]!.token;
    const submit = makeSubmitSurvey({ store, clock });
    for (const rating of [0, 6, 2.5]) expect(await submit({ token, answer: { ...answer, rating } })).toMatchObject({ ok: false, error: { code: "invalid_rating" } });
    expect(await submit({ token, answer: { ...answer, comment: "  hi " } })).toMatchObject({ ok: false, error: { code: "comment_invalid" } });
    expect(await submit({ token: "n".repeat(30), answer })).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect((await store.list())[0]!.status).toBe("sent");
  });
  it("treats publishing as opt-in", async () => {
    const { create, store, clock } = world();
    await create({ input, by: "o" });
    const token = (await store.list())[0]!.token;
    await makeSubmitSurvey({ store, clock })({ token, answer: { ...answer, allowPublish: false } });
    expect((await store.list())[0]!.response?.allowPublish).toBe(false);
  });
});

describe("turning an answer into a testimonial", () => {
  it("creates a draft with the rating, project and a consent note, once", async () => {
    const { create, store, clock, drafts, testimonials } = world();
    await create({ input, by: "o" });
    const survey = (await store.list())[0]!;
    await makeSubmitSurvey({ store, clock })({ token: survey.token, answer });
    const convert = makeConvertSurvey({ store, testimonials });
    expect(await convert(survey.id)).toMatchObject({ ok: true, value: { testimonialId: "t1" } });
    expect(drafts[0]).toMatchObject({ rating: 5, projectSlug: "smart-clinic", name: { ar: "سارة" }, quote: { ar: "تجربة ممتازة وتعامل راقي" } });
    expect(drafts[0]!.consentNote).toContain("2026-10-15");
    expect(await convert(survey.id)).toMatchObject({ ok: false, error: { code: "already_converted" } });
    expect(drafts).toHaveLength(1);
  });
  it("refuses without the client's consent, before an answer, or for an unknown survey", async () => {
    const { create, store, clock, drafts, testimonials } = world();
    await create({ input, by: "o" });
    const survey = (await store.list())[0]!;
    const convert = makeConvertSurvey({ store, testimonials });
    expect(await convert(survey.id)).toMatchObject({ ok: false, error: { code: "not_answered" } });
    await makeSubmitSurvey({ store, clock })({ token: survey.token, answer: { ...answer, allowPublish: false } });
    expect(await convert(survey.id)).toMatchObject({ ok: false, error: { code: "consent_missing" } });
    expect(await convert("ghost")).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(drafts).toHaveLength(0);
  });
});

describe("messages, email, list, delete", () => {
  const company = { ar: "حلول تك", en: "HULOL TECH" };
  it("builds invitation texts with the link, in either language, with no promises or emoji", () => {
    const ar = buildSurveyMessage({ locale: "ar", clientName: "سارة", projectTitle: { ar: "عيادة", en: "Clinic" }, link: "https://site.example/ar/survey/abc", company });
    expect(ar.whatsapp).toContain("https://site.example/ar/survey/abc");
    expect(ar.emailSubject).toContain("عيادة");
    const en = buildSurveyMessage({ locale: "en", clientName: "Sara", projectTitle: { ar: "عيادة", en: "Clinic" }, link: "https://site.example/en/survey/abc", company });
    expect(en.whatsapp).toContain("Clinic");
    for (const text of [ar.whatsapp, ar.emailSubject, en.whatsapp, en.emailSubject]) expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
  });
  it("escapes the email HTML and links only https URLs", () => {
    const mail = toSurveyEmail("موضوع", "هلا <b>x</b>\nhttps://a.example/s?a=1&b=2\njavascript:alert(1)");
    expect(mail.html).not.toContain("<b>");
    expect(mail.html).toContain('<a href="https://a.example/s?a=1&amp;b=2">');
    expect(mail.html).not.toContain('href="javascript');
  });
  it("sends only to the address saved on the survey", async () => {
    const { create, store } = world();
    await create({ input, by: "o" });
    await create({ input: { ...input, clientEmail: "" }, by: "o" });
    const [withEmail, noEmail] = [...(await store.list())].sort((a, b) => a.id.localeCompare(b.id));
    const sent: string[] = [];
    const send = makeSendSurveyEmail({ store, mailer: { send: async (m) => (sent.push(m.to), true) } });
    expect((await send({ id: withEmail!.id, subject: "s", body: "b" })).ok).toBe(true);
    expect(sent).toEqual(["s@example.com"]);
    expect(await send({ id: noEmail!.id, subject: "s", body: "b" })).toMatchObject({ ok: false, error: { code: "no_email" } });
    expect(await send({ id: "ghost", subject: "s", body: "b" })).toMatchObject({ ok: false, error: { code: "not_found" } });
    expect(await send({ id: withEmail!.id, subject: " ", body: "b" })).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(await makeSendSurveyEmail({ store, mailer: { send: async () => false } })({ id: withEmail!.id, subject: "s", body: "b" })).toMatchObject({ ok: false, error: { code: "send_failed" } });
  });
  it("lists newest first, averages answered ratings, and deletes", async () => {
    const { create, store, clock } = world();
    await create({ input, by: "o" });
    await create({ input: { ...input, clientName: "علي" }, by: "o" });
    const all = await makeListSurveys({ store })();
    expect(all).toHaveLength(2);
    expect(averageRating(all)).toBeNull();
    await makeSubmitSurvey({ store, clock })({ token: all[0]!.token, answer: { ...answer, rating: 4 } });
    await makeSubmitSurvey({ store, clock })({ token: all[1]!.token, answer: { ...answer, rating: 5 } });
    expect(averageRating(await makeListSurveys({ store })())).toBe(4.5);
    const remove = makeDeleteSurvey({ store });
    expect((await remove(all[0]!.id)).ok).toBe(true);
    expect(await remove(all[0]!.id)).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
});
