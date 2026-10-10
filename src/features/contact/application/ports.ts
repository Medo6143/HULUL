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

export interface ContactReceivedPayload {
  kind: "contact.received";
  messageId: string;
  name: string;
  email: string;
  message: string;
  locale: "ar" | "en";
}

export interface ContactEvents {
  contactReceived(event: ContactReceivedPayload): Promise<void>;
}
