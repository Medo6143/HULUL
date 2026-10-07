import type { Consent, Lead, StatusHistoryEntry } from "../domain/lead";

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
