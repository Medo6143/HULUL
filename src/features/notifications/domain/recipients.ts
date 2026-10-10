export const MAX_RECIPIENTS = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RecipientsError = { code: "invalid_email"; email: string } | { code: "too_many" } | { code: "empty" };

/** Trims, lowercases, drops duplicates, and checks every address. At least one recipient is required. */
export function normalizeRecipients(
  input: string[],
): { ok: true; value: string[] } | { ok: false; error: RecipientsError } {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const raw of input) {
    const email = raw.trim().toLowerCase();
    if (email === "") continue;
    if (!EMAIL_RE.test(email) || email.length > 200) return { ok: false, error: { code: "invalid_email", email: raw } };
    if (!seen.has(email)) {
      seen.add(email);
      list.push(email);
    }
  }
  if (list.length === 0) return { ok: false, error: { code: "empty" } };
  if (list.length > MAX_RECIPIENTS) return { ok: false, error: { code: "too_many" } };
  return { ok: true, value: list };
}
