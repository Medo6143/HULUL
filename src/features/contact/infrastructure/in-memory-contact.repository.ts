import type { ContactWriter } from "../application/ports";
import type { ContactConsent, ContactMessage } from "../domain/contact-message";

export class InMemoryContactRepository implements ContactWriter {
  readonly messages: ContactMessage[] = [];
  readonly consents: ContactConsent[] = [];

  async save(message: ContactMessage, consent: ContactConsent): Promise<void> {
    this.messages.push(message);
    this.consents.push(consent);
  }
}
