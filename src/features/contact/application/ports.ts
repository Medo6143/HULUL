import type { ContactConsent, ContactMessage } from "../domain/contact-message";

export interface ContactWriter {
  /** Persists the message and its consent record together. */
  save(message: ContactMessage, consent: ContactConsent): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}
