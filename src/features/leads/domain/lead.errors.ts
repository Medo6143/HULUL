export type LeadError =
  | { code: "invalid_phone" }
  | { code: "invalid_name" }
  | { code: "invalid_email" }
  | { code: "consent_required" }
  | { code: "transition_not_allowed"; from: string; to: string }
  | { code: "reason_required" }
  | { code: "not_found" };
