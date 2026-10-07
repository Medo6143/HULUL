// Pure domain code: no imports. The only place where status transitions are defined.

export const LEAD_STATUSES = [
  "new", "contacted", "consultation", "proposal", "negotiation", "won", "lost", "parked",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

const TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ["contacted", "parked", "lost"],
  contacted: ["consultation", "parked", "lost"],
  consultation: ["proposal", "lost", "parked"],
  proposal: ["negotiation", "won", "lost"],
  negotiation: ["won", "lost"],
  parked: ["contacted"],
  lost: ["contacted"],
  won: [],
};

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function requiresReason(to: LeadStatus): boolean {
  return to === "lost";
}
