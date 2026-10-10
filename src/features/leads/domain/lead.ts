import { canTransition, requiresReason, type LeadStatus } from "./lead-status";
import type { LeadError } from "./lead.errors";
import { err, ok, type Result } from "./result";

export type LeadType = "project" | "consultation";
export type LeadService = "web" | "mobile" | "design" | "unsure";
export type ContactChannel = "whatsapp" | "call" | "email";
export type LeadLocale = "ar" | "en";

export interface LeadSource {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  landingPage: string;
  referrer: string;
}

export interface Lead {
  id: string;
  type: LeadType;
  segment: string;
  service: LeadService;
  name: string;
  phone: string; // E.164 digits without "+"
  email: string;
  preferredContact: ContactChannel;
  businessType: string;
  budgetRange: string;
  timeline: string;
  description: string;
  locale: LeadLocale;
  status: LeadStatus;
  lostReason: string;
  assignedTo: string;
  source: LeadSource;
  /** Set the first time a lead leaves `new`; drives the reply-time analytics. */
  firstResponseAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Consent {
  kind: "pdpl_form";
  policyVersion: string;
  granted: true;
  ipHash: string;
  grantedAt: Date;
}

export interface StatusHistoryEntry {
  leadId: string;
  from: LeadStatus;
  to: LeadStatus;
  changedBy: string;
  reason: string;
  changedAt: Date;
}

export interface NewLeadInput {
  type: LeadType;
  segment: string;
  service: LeadService;
  name: string;
  phone: string;
  email: string;
  preferredContact: ContactChannel;
  businessType: string;
  budgetRange: string;
  timeline: string;
  description: string;
  locale: LeadLocale;
  source: LeadSource;
  consentGranted: boolean;
}

const PHONE_RE = /^[1-9]\d{7,14}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strips spaces, dashes, a leading "+" or "00". Saudi local "05xxxxxxxx" becomes 9665xxxxxxxx. */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (/^05\d{8}$/.test(digits)) digits = `966${digits.slice(1)}`;
  return digits;
}

/** Invariant 1: no lead without a valid phone and a recorded PDPL consent. */
export function createLead(
  input: NewLeadInput,
  ctx: { id: string; now: Date },
): Result<Lead, LeadError> {
  const name = input.name.trim();
  if (name.length < 2) return err({ code: "invalid_name" });

  const phone = normalizePhone(input.phone);
  if (!PHONE_RE.test(phone)) return err({ code: "invalid_phone" });

  const email = input.email.trim();
  if (email !== "" && !EMAIL_RE.test(email)) return err({ code: "invalid_email" });

  if (!input.consentGranted) return err({ code: "consent_required" });

  return ok({
    id: ctx.id,
    type: input.type,
    segment: input.segment,
    service: input.service,
    name,
    phone,
    email,
    preferredContact: input.preferredContact,
    businessType: input.businessType.trim(),
    budgetRange: input.budgetRange,
    timeline: input.timeline,
    description: input.description.trim(),
    locale: input.locale,
    status: "new",
    lostReason: "",
    assignedTo: "",
    source: input.source,
    firstResponseAt: null,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  });
}

/** Invariant 2: only allowed transitions; losing a lead requires a reason. */
export function changeStatus(
  lead: Lead,
  to: LeadStatus,
  ctx: { by: string; now: Date; reason?: string },
): Result<{ lead: Lead; history: StatusHistoryEntry }, LeadError> {
  if (!canTransition(lead.status, to)) {
    return err({ code: "transition_not_allowed", from: lead.status, to });
  }
  const reason = (ctx.reason ?? "").trim();
  if (requiresReason(to) && reason === "") return err({ code: "reason_required" });

  return ok({
    lead: {
      ...lead,
      status: to,
      lostReason: to === "lost" ? reason : lead.lostReason,
      firstResponseAt: lead.firstResponseAt ?? (lead.status === "new" ? ctx.now : null),
      updatedAt: ctx.now,
    },
    history: {
      leadId: lead.id,
      from: lead.status,
      to,
      changedBy: ctx.by,
      reason,
      changedAt: ctx.now,
    },
  });
}
