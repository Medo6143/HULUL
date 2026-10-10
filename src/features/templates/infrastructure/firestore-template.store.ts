import type { App } from "firebase-admin/app";
import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import type { TemplateStore } from "../application/usecases";
import type { InviteTemplates } from "../domain/templates";

/** `settings/templates`. Missing fields fall back to nothing here; the caller treats a missing document as "use defaults". */
export class FirestoreTemplateStore implements TemplateStore {
  private readonly db: Firestore;

  constructor(app: App) {
    this.db = getFirestore(app);
  }

  async get(): Promise<InviteTemplates | null> {
    const snap = await this.db.collection("settings").doc("templates").get();
    if (!snap.exists) return null;
    const data = snap.data() as Partial<InviteTemplates>;
    if (!data.whatsapp || !data.emailSubject || !data.emailBody) return null;
    return { whatsapp: data.whatsapp, emailSubject: data.emailSubject, emailBody: data.emailBody };
  }

  async save(templates: InviteTemplates, updatedBy: string): Promise<void> {
    await this.db
      .collection("settings")
      .doc("templates")
      .set({ ...templates, updatedBy, updatedAt: FieldValue.serverTimestamp() });
  }
}
