import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import type { RecipientStore } from "../application/ports";

type App = Parameters<typeof getFirestore>[0];

const CACHE_MS = 60_000;

/**
 * Alert recipients in `settings/notifications.recipients`. An empty or missing list falls back to the
 * address from the environment, so alerts keep working before anyone opens the settings page.
 */
export class FirestoreRecipientStore implements RecipientStore {
  private readonly db: Firestore;
  private cache: { at: number; list: string[] } | null = null;

  constructor(
    app: App,
    private readonly fallback: string[],
  ) {
    this.db = getFirestore(app);
  }

  async list(): Promise<string[]> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.list;
    let list: string[] = [];
    try {
      const snap = await this.db.collection("settings").doc("notifications").get();
      const raw = snap.exists ? snap.data()?.recipients : null;
      if (Array.isArray(raw)) list = raw.filter((v): v is string => typeof v === "string" && v.includes("@"));
    } catch {
      list = [];
    }
    const result = list.length > 0 ? list : this.fallback.filter(Boolean);
    this.cache = { at: Date.now(), list: result };
    return result;
  }

  async save(recipients: string[], updatedBy: string): Promise<void> {
    await this.db.collection("settings").doc("notifications").set({
      recipients,
      updatedBy,
      updatedAt: FieldValue.serverTimestamp(),
    });
    this.cache = null;
  }
}
