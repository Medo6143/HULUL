// Pure domain: the public contact details and social links the owner edits in the admin.

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const SOCIAL_KEYS = ["instagram", "x", "facebook", "linkedin", "youtube", "tiktok", "snapchat", "github", "telegram"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

export interface SiteSettings {
  /** Digits with country code, no plus (for example 966581897297). Empty hides every WhatsApp button. */
  whatsappNumber: string;
  /** Phone number as it should read on the site. Empty hides it. */
  phoneDisplay: string;
  email: string;
  /** Only https links; missing keys are not shown. */
  socials: Partial<Record<SocialKey, string>>;
}

export const EMPTY_SITE_SETTINGS: SiteSettings = { whatsappNumber: "", phoneDisplay: "", email: "", socials: {} };

export type SiteSettingsError =
  | { code: "invalid_whatsapp" }
  | { code: "invalid_phone" }
  | { code: "invalid_email" }
  | { code: "invalid_url"; field: SocialKey };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https:\/\/[^\s<>"']+$/;

/** Digits only; Saudi local 05xxxxxxxx becomes 9665xxxxxxxx; a leading 00 or + is dropped. */
export function normalizeWhatsapp(raw: string): string {
  let digits = raw.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (/^05\d{8}$/.test(digits)) digits = `966${digits.slice(1)}`;
  return digits;
}

export function normalizeSiteSettings(input: SiteSettings): Result<SiteSettings, SiteSettingsError> {
  const whatsappNumber = normalizeWhatsapp(input.whatsappNumber.trim());
  if (whatsappNumber !== "" && !/^[1-9]\d{7,14}$/.test(whatsappNumber)) return { ok: false, error: { code: "invalid_whatsapp" } };

  const phoneDisplay = input.phoneDisplay.trim();
  if (phoneDisplay !== "" && (phoneDisplay.length > 30 || !/^[\d+\s()-]+$/.test(phoneDisplay))) return { ok: false, error: { code: "invalid_phone" } };

  const email = input.email.trim().toLowerCase();
  if (email !== "" && (email.length > 200 || !EMAIL_RE.test(email))) return { ok: false, error: { code: "invalid_email" } };

  const socials: Partial<Record<SocialKey, string>> = {};
  for (const key of SOCIAL_KEYS) {
    const value = (input.socials[key] ?? "").trim();
    if (value === "") continue;
    if (value.length > 300 || !URL_RE.test(value)) return { ok: false, error: { code: "invalid_url", field: key } };
    socials[key] = value;
  }
  return { ok: true, value: { whatsappNumber, phoneDisplay, email, socials } };
}

/** Merges a stored document with the defaults, ignoring unknown or malformed fields. */
export function fromStored(data: Record<string, unknown> | undefined): SiteSettings {
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  const socialsRaw = (data?.socials && typeof data.socials === "object" ? data.socials : {}) as Record<string, unknown>;
  const socials: Partial<Record<SocialKey, string>> = {};
  for (const key of SOCIAL_KEYS) {
    const value = text(socialsRaw[key]);
    if (URL_RE.test(value)) socials[key] = value;
  }
  return { whatsappNumber: text(data?.whatsappNumber), phoneDisplay: text(data?.phoneDisplay), email: text(data?.email), socials };
}
