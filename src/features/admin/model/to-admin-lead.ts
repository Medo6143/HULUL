import type {
  AdminHistoryEntry,
  AdminLead,
  AdminLeadDetail,
  AdminNote,
  ContactKey,
  LeadStatusKey,
  ServiceKey,
  SourceKey,
} from "./admin-lead";

// Structural inputs, so this module does not import the leads feature. The domain `Lead` and
// `StatusHistoryEntry` types fit these shapes.
export interface LeadLike {
  id: string;
  service: ServiceKey;
  name: string;
  phone: string;
  email: string;
  preferredContact: ContactKey;
  businessType: string;
  timeline: string;
  description: string;
  status: LeadStatusKey;
  lostReason: string;
  assignedTo: string;
  locale?: "ar" | "en";
  source: { utmSource: string; utmCampaign: string; landingPage: string; referrer: string };
  firstResponseAt: Date | null;
  createdAt: Date;
}

export interface HistoryLike {
  from: LeadStatusKey | null;
  to: LeadStatusKey;
  changedBy: string;
  reason: string;
  changedAt: Date;
}

export interface NoteLike {
  id: string;
  authorName: string;
  text: string;
  createdAt: Date;
}

/** Maps UTM and referrer to one of the sources the dashboard groups by. */
export function sourceKey(utmSource: string, referrer: string): SourceKey {
  const value = `${utmSource} ${referrer}`.toLowerCase();
  if (value.includes("google")) return "google";
  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("snap")) return "snapchat";
  if (value.includes("whatsapp") || value.includes("wa.me")) return "whatsapp";
  if (utmSource.trim() === "" && referrer.trim() === "") return "direct";
  return "referral";
}

const TIMELINES = ["asap", "months", "flexible"] as const;

export function toAdminLead(lead: LeadLike): AdminLead {
  const timeline = (TIMELINES as readonly string[]).includes(lead.timeline)
    ? (lead.timeline as AdminLead["timeline"])
    : "";
  return {
    id: lead.id,
    name: lead.name,
    business: lead.businessType,
    service: lead.service,
    phone: lead.phone,
    email: lead.email,
    preferred: lead.preferredContact,
    status: lead.status,
    source: sourceKey(lead.source.utmSource, lead.source.referrer),
    campaign: lead.source.utmCampaign,
    landing: lead.source.landingPage,
    timeline,
    description: lead.description,
    createdAt: lead.createdAt.toISOString(),
    firstResponseAt: lead.firstResponseAt ? lead.firstResponseAt.toISOString() : null,
    assigned: lead.assignedTo,
    locale: lead.locale,
    isNew: lead.status === "new",
    lostReason: lead.lostReason,
  };
}

export function toAdminDetail(lead: LeadLike, history: HistoryLike[], notes: NoteLike[]): AdminLeadDetail {
  const mappedHistory: AdminHistoryEntry[] = history.map((h) => ({
    from: h.from,
    to: h.to,
    by: h.changedBy,
    at: h.changedAt.toISOString(),
    reason: h.reason,
  }));
  // The first entry of a lead's life is its creation, which the repository does not store as a status change.
  const created: AdminHistoryEntry = {
    from: null,
    to: "new",
    by: "",
    at: lead.createdAt.toISOString(),
    reason: "",
  };
  const mappedNotes: AdminNote[] = notes.map((n) => ({
    id: n.id,
    by: n.authorName,
    at: n.createdAt.toISOString(),
    text: n.text,
  }));
  return { ...toAdminLead(lead), history: [created, ...mappedHistory], notes: mappedNotes };
}
