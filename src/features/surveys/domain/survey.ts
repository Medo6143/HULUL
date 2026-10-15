// Pure domain: a short customer survey sent by link, and what happens to the answer.
// The client rates a project, writes a comment, and may allow it to be published. Publishing needs that
// consent, so converting an answer into a testimonial is refused without it.

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export interface Localized {
  ar: string;
  en: string;
}

export type SurveyError =
  | { code: "invalid_input" }
  | { code: "invalid_email" }
  | { code: "invalid_phone" }
  | { code: "invalid_rating" }
  | { code: "comment_invalid" }
  | { code: "not_found" }
  | { code: "already_answered" }
  | { code: "consent_missing" }
  | { code: "not_answered" }
  | { code: "already_converted" }
  | { code: "no_email" }
  | { code: "send_failed" };

export interface SurveyResponse {
  rating: number;
  comment: string;
  name: string;
  role: string;
  /** The client ticked "you may publish my name and comment". */
  allowPublish: boolean;
  answeredAt: Date;
}

export interface Survey {
  id: string;
  /** Unguessable part of the public link. Stored as is: it only lets someone answer this one survey. */
  token: string;
  projectSlug: string;
  projectTitle: Localized;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  locale: "ar" | "en";
  status: "sent" | "answered";
  createdAt: Date;
  createdBy: string;
  response: SurveyResponse | null;
  /** Set once the answer became a testimonial. */
  testimonialId: string;
}

export interface NewSurveyInput {
  projectSlug: string;
  projectTitle: Localized;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  locale: "ar" | "en";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: string, max: number) => value.trim().slice(0, max);

/** Digits only; Saudi local 05xxxxxxxx becomes 9665xxxxxxxx. Empty stays empty (the phone is optional). */
export function normalizeSurveyPhone(raw: string): string {
  let digits = raw.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (/^05\d{8}$/.test(digits)) digits = `966${digits.slice(1)}`;
  return digits;
}

export function createSurvey(input: NewSurveyInput, ctx: { id: string; token: string; now: Date; by: string }): Result<Survey, SurveyError> {
  const clientName = clean(input.clientName, 100);
  const projectTitle = { ar: clean(input.projectTitle.ar, 140), en: clean(input.projectTitle.en, 140) };
  if (clientName.length < 2 || (!projectTitle.ar && !projectTitle.en)) return err({ code: "invalid_input" });
  const clientPhone = normalizeSurveyPhone(input.clientPhone);
  if (clientPhone !== "" && !/^[1-9]\d{7,14}$/.test(clientPhone)) return err({ code: "invalid_phone" });
  const clientEmail = input.clientEmail.trim().toLowerCase();
  if (clientEmail !== "" && (clientEmail.length > 200 || !EMAIL_RE.test(clientEmail))) return err({ code: "invalid_email" });
  return ok({
    id: ctx.id,
    token: ctx.token,
    projectSlug: clean(input.projectSlug, 60).toLowerCase(),
    projectTitle: { ar: projectTitle.ar || projectTitle.en, en: projectTitle.en || projectTitle.ar },
    clientName,
    clientPhone,
    clientEmail,
    locale: input.locale,
    status: "sent",
    createdAt: ctx.now,
    createdBy: ctx.by,
    response: null,
    testimonialId: "",
  });
}

export interface SurveyAnswerInput {
  rating: number;
  comment: string;
  name: string;
  role: string;
  allowPublish: boolean;
}

/** One answer per survey. The comment must say something; the name defaults to the one the owner typed. */
export function submitAnswer(survey: Survey, input: SurveyAnswerInput, now: Date): Result<Survey, SurveyError> {
  if (survey.status === "answered") return err({ code: "already_answered" });
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return err({ code: "invalid_rating" });
  const comment = clean(input.comment, 1000);
  if (comment.length < 5) return err({ code: "comment_invalid" });
  return ok({
    ...survey,
    status: "answered",
    response: {
      rating: input.rating,
      comment,
      name: clean(input.name, 100) || survey.clientName,
      role: clean(input.role, 100),
      allowPublish: input.allowPublish === true,
      answeredAt: now,
    },
  });
}

export interface TestimonialDraft {
  quote: Localized;
  name: Localized;
  role: Localized;
  rating: number;
  projectSlug: string;
  consentNote: string;
}

/** What the testimonial draft looks like. Refused unless the client allowed publishing. */
export function toTestimonialDraft(survey: Survey): Result<TestimonialDraft, SurveyError> {
  if (!survey.response) return err({ code: "not_answered" });
  if (survey.testimonialId) return err({ code: "already_converted" });
  if (!survey.response.allowPublish) return err({ code: "consent_missing" });
  const r = survey.response;
  const day = r.answeredAt.toISOString().slice(0, 10);
  return ok({
    quote: { ar: r.comment, en: survey.locale === "en" ? r.comment : "" },
    name: { ar: r.name, en: r.name },
    role: { ar: r.role, en: r.role },
    rating: r.rating,
    projectSlug: survey.projectSlug,
    consentNote: `وافق العميل على النشر عبر الاستبيان بتاريخ ${day} (رقم الاستبيان ${survey.id})`,
  });
}

export interface SurveyMessage {
  whatsapp: string;
  emailSubject: string;
  emailBody: string;
}

/** The invitation texts. They ask for an opinion and promise nothing. */
export function buildSurveyMessage(input: { locale: "ar" | "en"; clientName: string; projectTitle: Localized; link: string; company: Localized }): SurveyMessage {
  const project = input.projectTitle[input.locale] || input.projectTitle.ar;
  const company = input.company[input.locale] || input.company.ar;
  if (input.locale === "ar") {
    const body = `هلا ${input.clientName}،\n\nشكرًا لثقتك بنا في مشروع ${project}. يهمنا رأيك بتجربتك مع ${company}، وياخذ منك دقيقة وحدة فقط.\n\nقيّم المشروع واكتب تعليقك من هنا:\n${input.link}`;
    return { whatsapp: body, emailSubject: `رأيك يهمنا: ${project}`, emailBody: body };
  }
  const body = `Hello ${input.clientName},\n\nThank you for trusting us with ${project}. We would value your opinion of your experience with ${company}; it takes about a minute.\n\nRate the project and leave a comment here:\n${input.link}`;
  return { whatsapp: body, emailSubject: `We value your opinion: ${project}`, emailBody: body };
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Email text and HTML for already-written subject and body. Links become anchors; everything else is escaped. */
export function toSurveyEmail(subject: string, body: string): { subject: string; text: string; html: string } {
  const html =
    `<div dir="auto" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#0f172a">` +
    body
      .split("\n")
      .map((line) => (line.trim() === "" ? "<br>" : `<p style="margin:0 0 6px">${esc(line).replace(/(https:\/\/[^\s<]+)/g, (u) => `<a href="${u}">${u}</a>`)}</p>`))
      .join("") +
    "</div>";
  return { subject: subject.trim().slice(0, 150), text: body, html };
}

export const averageRating = (surveys: readonly Survey[]): number | null => {
  const rated = surveys.flatMap((s) => (s.response ? [s.response.rating] : []));
  return rated.length === 0 ? null : rated.reduce((a, b) => a + b, 0) / rated.length;
};
