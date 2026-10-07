import { getFirestore, Timestamp, type Firestore } from "firebase-admin/firestore";
import type { ContactWriter } from "../application/ports";
import type { ContactConsent, ContactMessage } from "../domain/contact-message";

type App = Parameters<typeof getFirestore>[0];

export class FirestoreContactRepository implements ContactWriter {
  private readonly db: Firestore;

  constructor(app: App) {
    this.db = getFirestore(app);
  }

  async save(message: ContactMessage, consent: ContactConsent): Promise<void> {
    const batch = this.db.batch();
    batch.set(this.db.collection("contactMessages").doc(message.id), {
      name: message.name,
      email: message.email,
      message: message.message,
      locale: message.locale,
      createdAt: Timestamp.fromDate(message.createdAt),
    });
    batch.set(this.db.collection("consents").doc(), {
      subjectType: "contact",
      subjectId: message.id,
      kind: consent.kind,
      policyVersion: consent.policyVersion,
      granted: consent.granted,
      ipHash: consent.ipHash,
      grantedAt: Timestamp.fromDate(consent.grantedAt),
    });
    await batch.commit();
  }
}
