import type { Consent, Lead, StatusHistoryEntry } from "../domain/lead";
import type { LeadNote } from "../domain/note";

export interface LeadWriter {
  /** Persists the lead and its consent record together. */
  saveNew(lead: Lead, consent: Consent): Promise<void>;
  update(lead: Lead, history: StatusHistoryEntry): Promise<void>;
}

export interface LeadReader {
  findById(id: string): Promise<Lead | null>;
  list(filter?: { status?: Lead["status"] }): Promise<Lead[]>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

export interface LeadNoteStore {
  addNote(note: LeadNote): Promise<void>;
  listNotes(leadId: string): Promise<LeadNote[]>;
}

export interface LeadHistoryReader {
  history(leadId: string): Promise<StatusHistoryEntry[]>;
}

/** What other parts of the system learn when a lead is created. Notification failures never fail the request. */
export interface LeadCreatedPayload {
  kind: "lead.created";
  leadId: string;
  type: "project" | "consultation";
  name: string;
  phone: string;
  email: string;
  service: string;
  description: string;
  locale: "ar" | "en";
  landingPage: string;
}

export interface LeadEvents {
  leadCreated(event: LeadCreatedPayload): Promise<void>;
}
