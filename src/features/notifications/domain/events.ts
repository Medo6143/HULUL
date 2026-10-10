// Pure domain. Events carry only what a notification needs.

export type NotifyLocale = "ar" | "en";

export interface LeadCreatedEvent {
  kind: "lead.created";
  leadId: string;
  type: "project" | "consultation";
  name: string;
  phone: string;
  email: string;
  service: string;
  description: string;
  locale: NotifyLocale;
  landingPage: string;
}

export interface ContactReceivedEvent {
  kind: "contact.received";
  messageId: string;
  name: string;
  email: string;
  message: string;
  locale: NotifyLocale;
}

export type NotificationEvent = LeadCreatedEvent | ContactReceivedEvent;

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}
