// Segment landing pages (backlog 2.3). Copy lives in messages under "segments.<slug>".
export const segments = [
  { slug: "smes", whatsappContext: "general" },
  { slug: "startups", whatsappContext: "general" },
  { slug: "agencies", whatsappContext: "agency" },
  { slug: "enterprise", whatsappContext: "enterprise" },
] as const;

export type SegmentSlug = (typeof segments)[number]["slug"];

export function isSegmentSlug(value: string): value is SegmentSlug {
  return segments.some((segment) => segment.slug === value);
}
