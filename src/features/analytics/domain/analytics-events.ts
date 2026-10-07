// Single source of truth for analytics events. No free-form event names anywhere else.
// Every event is sent only after the visitor grants analytics consent.

export type Locale = "ar" | "en";
export type Service = "web" | "mobile" | "design" | "unsure";
export type Segment = "sme" | "startup" | "agency" | "enterprise";

export type AnalyticsEvent =
  | { name: "cta_click"; params: { location: string; label: string; locale: Locale } }
  | { name: "language_toggle"; params: { from: Locale; to: Locale } }
  | { name: "form_start"; params: { form: "project" | "consultation"; service?: Service } }
  | { name: "form_step_complete"; params: { form: "project" | "consultation"; step: number } }
  | { name: "form_abandon"; params: { form: "project" | "consultation"; last_step: number } }
  | { name: "generate_lead"; params: { form: "project" | "consultation"; service: Service; segment?: Segment; locale: Locale } }
  | { name: "consultation_booking_start"; params: { channel: "email" | "whatsapp" } }
  | { name: "consultation_booking_complete"; params: { channel: "email" | "whatsapp" } }
  | { name: "whatsapp_click"; params: { location: string; page: string; locale: Locale } }
  | { name: "phone_click"; params: { location: string } }
  | { name: "email_click"; params: { location: string } }
  | { name: "case_study_view"; params: { slug: string } }
  | { name: "cost_section_view"; params: { page: string } }
  | { name: "scroll_75"; params: { page: string } };

// Server-side lifecycle events (written by use-cases, shown in the admin analytics screen).
export type LifecycleEvent =
  | "lead_status_change"
  | "first_response"
  | "proposal_sent"
  | "proposal_viewed"
  | "proposal_accepted"
  | "deal_won"
  | "deal_lost";
