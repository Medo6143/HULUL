// Pure domain: the ready-made consultation invitation texts (WhatsApp and email) and how they are filled in.

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type TemplateError = { code: "invalid_input" } | { code: "not_found" } | { code: "no_email" } | { code: "send_failed" };

export interface Localized {
  ar: string;
  en: string;
}

export const TEMPLATE_VARIABLES = ["name", "service", "date", "time", "meetingLink", "company"] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
export type TemplateValues = Partial<Record<TemplateVariable, string>>;

export interface InviteTemplates {
  whatsapp: Localized;
  emailSubject: Localized;
  emailBody: Localized;
}

export const MAX_LENGTHS = { whatsapp: 1000, emailSubject: 150, emailBody: 4000 } as const;

/**
 * Neutral starting texts. They promise no reply time, price, or result; the owner edits them freely.
 * A line whose variables are all empty is dropped when rendering, so a missing link or time leaves no gap.
 */
export const DEFAULT_TEMPLATES: InviteTemplates = {
  whatsapp: {
    ar: "هلا {{name}}، معك فريق {{company}}.\nيسعدنا نرتب لك استشارة بخصوص {{service}}.\nالموعد المقترح: {{date}} الساعة {{time}} (توقيت الرياض)\nرابط الاجتماع: {{meetingLink}}\nإذا الوقت ما يناسبك قل لنا ونرتب وقت ثاني.",
    en: "Hello {{name}}, this is the {{company}} team.\nWe would be glad to arrange a consultation about {{service}}.\nProposed time: {{date}} at {{time}} (Riyadh time)\nMeeting link: {{meetingLink}}\nIf the time does not suit you, tell us and we will arrange another.",
  },
  emailSubject: {
    ar: "دعوة لاستشارة مع {{company}}",
    en: "Invitation to a consultation with {{company}}",
  },
  emailBody: {
    ar: "هلا {{name}}،\n\nشكرا لتواصلك مع {{company}}. نبغى نرتب معك استشارة بخصوص {{service}}.\n\nالموعد المقترح: {{date}} الساعة {{time}} (توقيت الرياض)\nرابط الاجتماع: {{meetingLink}}\n\nإذا الوقت ما يناسبك رد على هذي الرسالة ونرتب وقت ثاني.",
    en: "Hello {{name}},\n\nThank you for contacting {{company}}. We would like to arrange a consultation with you about {{service}}.\n\nProposed time: {{date}} at {{time}} (Riyadh time)\nMeeting link: {{meetingLink}}\n\nIf the time does not suit you, reply to this message and we will arrange another.",
  },
};

const VAR_RE = /\{\{\s*([a-zA-Z]+)\s*\}\}/g;
const isVariable = (name: string): name is TemplateVariable => (TEMPLATE_VARIABLES as readonly string[]).includes(name);

/**
 * Fills the allowed variables. Unknown `{{names}}` stay as written so a typo is visible in the preview. A line
 * that had variables and ended up with none of them filled is removed.
 */
export function renderTemplate(template: string, values: TemplateValues): string {
  const lines = template.split("\n").flatMap((line) => {
    let known = 0;
    let filled = 0;
    const out = line.replace(VAR_RE, (match, name: string) => {
      if (!isVariable(name)) return match;
      known++;
      const value = (values[name] ?? "").trim();
      if (value) filled++;
      return value;
    });
    return known > 0 && filled === 0 ? [] : [out.trimEnd()];
  });
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export interface RenderedInviteEmail {
  subject: string;
  text: string;
  html: string;
}

/** Email text and HTML for already-rendered subject and body. Links become anchors; everything is escaped. */
export function toInviteEmail(subject: string, body: string): RenderedInviteEmail {
  const html =
    `<div dir="auto" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#0f172a">` +
    body
      .split("\n")
      .map((line) => {
        if (line.trim() === "") return "<br>";
        const safe = esc(line).replace(/(https:\/\/[^\s<]+)/g, (url) => `<a href="${url}">${url}</a>`);
        return `<p style="margin:0 0 6px">${safe}</p>`;
      })
      .join("") +
    "</div>";
  return { subject: subject.trim().slice(0, MAX_LENGTHS.emailSubject), text: body, html };
}

const within = (value: string, max: number) => value.trim().length > 0 && value.length <= max;

/** Arabic is required for every text; English may be empty (the Arabic text is used instead). */
export function normalizeTemplates(input: InviteTemplates): Result<InviteTemplates, TemplateError> {
  const out: InviteTemplates = {
    whatsapp: { ar: input.whatsapp.ar.trim(), en: input.whatsapp.en.trim() },
    emailSubject: { ar: input.emailSubject.ar.trim(), en: input.emailSubject.en.trim() },
    emailBody: { ar: input.emailBody.ar.trim(), en: input.emailBody.en.trim() },
  };
  const ok =
    within(out.whatsapp.ar, MAX_LENGTHS.whatsapp) &&
    out.whatsapp.en.length <= MAX_LENGTHS.whatsapp &&
    within(out.emailSubject.ar, MAX_LENGTHS.emailSubject) &&
    out.emailSubject.en.length <= MAX_LENGTHS.emailSubject &&
    within(out.emailBody.ar, MAX_LENGTHS.emailBody) &&
    out.emailBody.en.length <= MAX_LENGTHS.emailBody;
  return ok ? { ok: true, value: out } : { ok: false, error: { code: "invalid_input" } };
}

/** The template text for a language, falling back to Arabic when the English one is empty. */
export const pickText = (text: Localized, locale: "ar" | "en"): string => (locale === "en" && text.en ? text.en : text.ar);

/** WhatsApp deep link with the message prefilled. Returns null unless the number is valid digits. */
export function whatsappLink(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
