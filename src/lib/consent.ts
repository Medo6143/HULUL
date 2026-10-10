export const CONSENT_STORAGE_KEY = "hulol.consent.v1";
/** Fired on window after the visitor saves a choice (detail: ConsentState). */
export const CONSENT_CHANGED_EVENT = "hulol:consent";
/** Fire on window to reopen the cookie choices, so consent can be changed or withdrawn. */
export const CONSENT_OPEN_EVENT = "hulol:open-consent";

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export function parseConsent(raw: string | null): ConsentState | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const record = data as Record<string, unknown>;
    if (record.necessary !== true) return null;
    if (typeof record.analytics !== "boolean") return null;
    if (typeof record.marketing !== "boolean") return null;
    if (typeof record.updatedAt !== "string") return null;
    return {
      necessary: true,
      analytics: record.analytics,
      marketing: record.marketing,
      updatedAt: record.updatedAt,
    };
  } catch {
    return null;
  }
}

export function serializeConsent(state: ConsentState): string {
  return JSON.stringify(state);
}
