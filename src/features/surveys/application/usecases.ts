import {
  createSurvey,
  submitAnswer,
  toSurveyEmail,
  toTestimonialDraft,
  type Localized,
  type NewSurveyInput,
  type Result,
  type Survey,
  type SurveyAnswerInput,
  type SurveyError,
  type TestimonialDraft,
} from "../domain/survey";

export interface SurveyStore {
  list(): Promise<Survey[]>;
  get(id: string): Promise<Survey | null>;
  findByToken(token: string): Promise<Survey | null>;
  save(survey: Survey): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface Clock {
  now(): Date;
}
export interface IdGenerator {
  next(): string;
}

/** A project's display name, looked up by its case-study slug. */
export interface ProjectLookup {
  titleOf(slug: string): Promise<Localized | null>;
}

/** Turns an approved answer into a draft testimonial. Wired in the composition root. */
export interface TestimonialCreator {
  create(draft: TestimonialDraft): Promise<{ ok: true; id: string } | { ok: false }>;
}

export interface SurveyMailer {
  send(input: { surveyId: string; to: string; subject: string; text: string; html: string }): Promise<boolean>;
}

const fail = (code: SurveyError["code"]): Result<never, SurveyError> => ({ ok: false, error: { code } });

export function makeListSurveys(deps: { store: SurveyStore }) {
  return async function listSurveys(): Promise<Survey[]> {
    return (await deps.store.list()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };
}

/** The owner creates a survey for one client and one project. `projectSlug` may be empty with a typed title. */
export function makeCreateSurvey(deps: { store: SurveyStore; projects: ProjectLookup; clock: Clock; ids: IdGenerator; newToken: () => string }) {
  return async function create(req: {
    input: Omit<NewSurveyInput, "projectTitle"> & { projectTitle?: Localized };
    by: string;
  }): Promise<Result<Survey, SurveyError>> {
    const slug = req.input.projectSlug.trim().toLowerCase();
    const found = slug ? await deps.projects.titleOf(slug) : null;
    const projectTitle = found ?? req.input.projectTitle ?? { ar: "", en: "" };
    const created = createSurvey({ ...req.input, projectSlug: found ? slug : "", projectTitle }, { id: deps.ids.next(), token: deps.newToken(), now: deps.clock.now(), by: req.by });
    if (!created.ok) return created;
    await deps.store.save(created.value);
    return created;
  };
}

/** What the public page may show: the project and the client's first name, never contact details. */
export function makeGetSurveyForPage(deps: { store: SurveyStore }) {
  return async function getSurveyForPage(token: string): Promise<{ projectTitle: Localized; clientName: string; locale: "ar" | "en"; answered: boolean } | null> {
    if (token.length < 16 || token.length > 100) return null;
    const survey = await deps.store.findByToken(token);
    return survey ? { projectTitle: survey.projectTitle, clientName: survey.clientName, locale: survey.locale, answered: survey.status === "answered" } : null;
  };
}

export function makeSubmitSurvey(deps: { store: SurveyStore; clock: Clock }) {
  return async function submit(req: { token: string; answer: SurveyAnswerInput }): Promise<Result<null, SurveyError>> {
    if (req.token.length < 16 || req.token.length > 100) return fail("not_found");
    const survey = await deps.store.findByToken(req.token);
    if (!survey) return fail("not_found");
    const answered = submitAnswer(survey, req.answer, deps.clock.now());
    if (!answered.ok) return answered;
    await deps.store.save(answered.value);
    return { ok: true, value: null };
  };
}

export function makeConvertSurvey(deps: { store: SurveyStore; testimonials: TestimonialCreator }) {
  return async function convert(id: string): Promise<Result<{ testimonialId: string }, SurveyError>> {
    const survey = await deps.store.get(id);
    if (!survey) return fail("not_found");
    const draft = toTestimonialDraft(survey);
    if (!draft.ok) return draft;
    const created = await deps.testimonials.create(draft.value);
    if (!created.ok) return fail("invalid_input");
    await deps.store.save({ ...survey, testimonialId: created.id });
    return { ok: true, value: { testimonialId: created.id } };
  };
}

export function makeDeleteSurvey(deps: { store: SurveyStore }) {
  return async function remove(id: string): Promise<Result<null, SurveyError>> {
    if (!(await deps.store.get(id))) return fail("not_found");
    await deps.store.delete(id);
    return { ok: true, value: null };
  };
}

/** Emails the (staff-edited) invitation to the address saved on the survey. */
export function makeSendSurveyEmail(deps: { store: SurveyStore; mailer: SurveyMailer }) {
  return async function send(req: { id: string; subject: string; body: string }): Promise<Result<null, SurveyError>> {
    const subject = req.subject.trim();
    const body = req.body.trim();
    if (!subject || !body || subject.length > 150 || body.length > 4000) return fail("invalid_input");
    const survey = await deps.store.get(req.id);
    if (!survey) return fail("not_found");
    if (!survey.clientEmail) return fail("no_email");
    const mail = toSurveyEmail(subject, body);
    return (await deps.mailer.send({ surveyId: survey.id, to: survey.clientEmail, ...mail })) ? { ok: true, value: null } : fail("send_failed");
  };
}
