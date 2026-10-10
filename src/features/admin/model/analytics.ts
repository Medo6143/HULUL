import { LOST_REASON_KEYS, isLostReasonKey, type AdminLead, type ContactKey, type LeadStatusKey, type ServiceKey, type SourceKey } from "./admin-lead";

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 7;

/** Pipeline order. A lead counts for every stage up to its current one. Lost and parked leads are not in the funnel. */
const FUNNEL: LeadStatusKey[] = ["new", "contacted", "consultation", "proposal", "won"];
const RANK: Partial<Record<LeadStatusKey, number>> = {
  new: 0,
  contacted: 1,
  consultation: 2,
  proposal: 3,
  negotiation: 3,
  won: 4,
};

export interface AnalyticsData {
  kpis: { key: "new" | "consultations" | "proposals" | "won"; value: number; delta: number }[];
  firstReply: { medianHours: number | null; deltaHours: number | null; overLimit: number | null };
  funnel: { status: LeadStatusKey; count: number }[];
  sources: { source: SourceKey; leads: number; deals: number }[];
  services: { key: ServiceKey; value: number }[];
  contact: { key: ContactKey; value: number }[];
  losses: { key: (typeof LOST_REASON_KEYS)[number]; value: number }[];
  total: number;
}

const rankOf = (status: LeadStatusKey): number => RANK[status] ?? -1;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Dashboard numbers computed from the leads themselves. Stage counts use each lead's current status
 * (a lead now at `proposal` has passed `contacted` and `consultation`), so they are close approximations,
 * not an event log. `firstReplyLimitHours` stays null until management sets a reply limit.
 */
export function computeAnalytics(
  leads: AdminLead[],
  now: Date,
  firstReplyLimitHours: number | null = null,
): AnalyticsData {
  const end = now.getTime();
  const thisStart = end - WINDOW_DAYS * DAY;
  const prevStart = end - 2 * WINDOW_DAYS * DAY;

  const inRange = (lead: AdminLead, from: number, to: number) => {
    const t = new Date(lead.createdAt).getTime();
    return t >= from && t < to;
  };
  const cur = leads.filter((l) => inRange(l, thisStart, end + 1));
  const prev = leads.filter((l) => inRange(l, prevStart, thisStart));

  const reached = (list: AdminLead[], minRank: number) => list.filter((l) => rankOf(l.status) >= minRank).length;
  const kpi = (key: AnalyticsData["kpis"][number]["key"], minRank: number) => {
    const value = key === "new" ? cur.length : reached(cur, minRank);
    const before = key === "new" ? prev.length : reached(prev, minRank);
    return { key, value, delta: value - before };
  };

  const replyHours = (list: AdminLead[]) =>
    list
      .filter((l) => l.firstResponseAt)
      .map((l) => (new Date(l.firstResponseAt!).getTime() - new Date(l.createdAt).getTime()) / (60 * 60 * 1000))
      .filter((h) => h >= 0);
  const curMedian = median(replyHours(cur));
  const prevMedian = median(replyHours(prev));

  const overLimit =
    firstReplyLimitHours === null
      ? null
      : cur.filter((l) => {
          const answered = l.firstResponseAt ? new Date(l.firstResponseAt).getTime() : end;
          return (answered - new Date(l.createdAt).getTime()) / (60 * 60 * 1000) > firstReplyLimitHours;
        }).length;

  const count = <K extends string>(keys: readonly K[], pick: (l: AdminLead) => K | null) =>
    keys.map((key) => ({ key, value: leads.filter((l) => pick(l) === key).length }));

  const sourceKeys: SourceKey[] = ["google", "linkedin", "snapchat", "direct", "referral", "whatsapp"];

  return {
    kpis: [kpi("new", 0), kpi("consultations", 2), kpi("proposals", 3), kpi("won", 4)],
    firstReply: {
      medianHours: curMedian === null ? null : round1(curMedian),
      deltaHours: curMedian !== null && prevMedian !== null ? round1(curMedian - prevMedian) : null,
      overLimit,
    },
    funnel: FUNNEL.map((status) => ({ status, count: reached(leads, rankOf(status)) })),
    sources: sourceKeys
      .map((source) => ({
        source,
        leads: leads.filter((l) => l.source === source).length,
        deals: leads.filter((l) => l.source === source && l.status === "won").length,
      }))
      .filter((row) => row.leads > 0)
      .sort((a, b) => b.leads - a.leads),
    services: count(["web", "mobile", "design", "unsure"] as const, (l) => l.service).filter((r) => r.value > 0),
    contact: count(["whatsapp", "call", "email"] as const, (l) => l.preferred),
    losses: LOST_REASON_KEYS.map((key) => ({
      key,
      value: leads.filter((l) => l.status === "lost" && (isLostReasonKey(l.lostReason) ? l.lostReason : "other") === key).length,
    })).filter((r) => r.value > 0),
    total: leads.length,
  };
}
