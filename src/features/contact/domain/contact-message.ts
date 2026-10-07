// Pure domain: no imports from libraries or other layers.

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type ContactError =
  | { code: "invalid_name" }
  | { code: "invalid_email" }
  | { code: "invalid_message" }
  | { code: "consent_required" };

export type ContactLocale = "ar" | "en";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  locale: ContactLocale;
  createdAt: Date;
}

export interface ContactConsent {
  kind: "pdpl_form";
  policyVersion: string;
  granted: true;
  ipHash: string;
  grantedAt: Date;
}

export interface NewContactMessage {
  name: string;
  email: string;
  message: string;
  locale: ContactLocale;
  consentGranted: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MESSAGE_MIN = 5;
export const MESSAGE_MAX = 2000;

export function createContactMessage(
  input: NewContactMessage,
  ctx: { id: string; now: Date },
): Result<ContactMessage, ContactError> {
  const name = input.name.trim();
  if (name.length < 2) return err({ code: "invalid_name" });

  const email = input.email.trim();
  if (!EMAIL_RE.test(email)) return err({ code: "invalid_email" });

  const message = input.message.trim();
  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
    return err({ code: "invalid_message" });
  }

  if (!input.consentGranted) return err({ code: "consent_required" });

  return ok({
    id: ctx.id,
    name,
    email,
    message,
    locale: input.locale,
    createdAt: ctx.now,
  });
}
