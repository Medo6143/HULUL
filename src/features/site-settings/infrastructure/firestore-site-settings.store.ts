import type { App } from "firebase-admin/app";
import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import type { SiteSettingsStore } from "../application/usecases";
import { fromStored, type SiteSettings } from "../domain/site-settings";

/** `settings/site`: readable by anyone (it holds only what the public site already shows), written by the server. */
export class FirestoreSiteSettingsStore implements SiteSettingsStore {
  private readonly db: Firestore;

  constructor(app: App) {
    this.db = getFirestore(app);
  }

  async get(): Promise<SiteSettings> {
    const snap = await this.db.collection("settings").doc("site").get();
    return fromStored(snap.exists ? snap.data() : undefined);
  }

  async save(settings: SiteSettings, updatedBy: string): Promise<void> {
    await this.db
      .collection("settings")
      .doc("site")
      .set({ ...settings, updatedBy, updatedAt: FieldValue.serverTimestamp() });
  }
}
