// View models for the admin screens. They are plain data, so demo rows and real Firestore rows share one shape.

export type LeadStatusKey =
  | "new"
  | "contacted"
  | "consultation"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost"
  | "parked";

export type ServiceKey = "web" | "mobile" | "design" | "unsure";
export type SourceKey = "google" | "direct" | "linkedin" | "snapchat" | "referral" | "whatsapp";
export type ContactKey = "whatsapp" | "call" | "email";

export interface AdminLead {
  id: string;
  name: string;
  business: string;
  service: ServiceKey;
  phone: string;
  email: string;
  preferred: ContactKey;
  status: LeadStatusKey;
  source: SourceKey;
  campaign: string;
  landing: string;
  timeline: "asap" | "months" | "flexible" | "";
  description: string;
  createdAt: string; // ISO, UTC
  firstResponseAt: string | null;
  assigned: string;
  isNew: boolean;
  lostReason: string;
}

export interface AdminHistoryEntry {
  from: LeadStatusKey | null;
  to: LeadStatusKey;
  by: string;
  at: string;
  reason: string;
}

export interface AdminNote {
  id: string;
  by: string;
  at: string;
  text: string;
}

export interface AdminLeadDetail extends AdminLead {
  history: AdminHistoryEntry[];
  notes: AdminNote[];
}

export const LOST_REASON_KEYS = ["price", "timing", "competitor", "noReply", "notFit", "other"] as const;
export type LostReasonKey = (typeof LOST_REASON_KEYS)[number];

export const isLostReasonKey = (value: string): value is LostReasonKey =>
  (LOST_REASON_KEYS as readonly string[]).includes(value);
