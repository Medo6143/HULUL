// Pure logic: which tracking providers may load, given the visitor's consent and the configured ids.
// Ids are interpolated into third-party scripts, so each one must match a strict pattern first.

export type ProviderKey = "ga4" | "clarity" | "meta" | "snap" | "tiktok";

export interface ProviderIds {
  ga4: string;
  clarity: string;
  meta: string;
  snap: string;
  tiktok: string;
}

const PATTERNS: Record<ProviderKey, RegExp> = {
  ga4: /^G-[A-Z0-9]{4,20}$/,
  clarity: /^[a-z0-9]{6,16}$/,
  meta: /^\d{8,20}$/,
  snap: /^[0-9a-f-]{16,48}$/i,
  tiktok: /^[A-Z0-9]{10,32}$/,
};

/** Analytics providers need the analytics choice; advertising pixels need the marketing choice. */
const CONSENT_KIND: Record<ProviderKey, "analytics" | "marketing"> = {
  ga4: "analytics",
  clarity: "analytics",
  meta: "marketing",
  snap: "marketing",
  tiktok: "marketing",
};

export function sanitizeId(key: ProviderKey, raw: string | undefined): string | null {
  const value = (raw ?? "").trim();
  return PATTERNS[key].test(value) ? value : null;
}

export function providersToLoad(
  consent: { analytics: boolean; marketing: boolean } | null,
  ids: ProviderIds,
): { key: ProviderKey; id: string }[] {
  if (!consent) return [];
  const result: { key: ProviderKey; id: string }[] = [];
  for (const key of Object.keys(PATTERNS) as ProviderKey[]) {
    if (!consent[CONSENT_KIND[key]]) continue;
    const id = sanitizeId(key, ids[key]);
    if (id) result.push({ key, id });
  }
  return result;
}
