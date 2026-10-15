import { FieldValue, getFirestore, type Firestore } from "firebase-admin/firestore";
import type { TelegramChatStore } from "../application/telegram.usecases";
import { telegramChatsFromStored, type TelegramChat } from "../domain/telegram";

type App = Parameters<typeof getFirestore>[0];

const CACHE_MS = 30_000;

/** `settings/notifications.telegramChats`, next to the email recipients (the save merges, never overwrites). */
export class FirestoreTelegramStore implements TelegramChatStore {
  private readonly db: Firestore;
  private cache: { at: number; list: TelegramChat[] } | null = null;

  constructor(app: App) {
    this.db = getFirestore(app);
  }

  async list(): Promise<TelegramChat[]> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.list;
    const snap = await this.db.collection("settings").doc("notifications").get();
    const list = telegramChatsFromStored(snap.exists ? snap.data()?.telegramChats : null);
    this.cache = { at: Date.now(), list };
    return list;
  }

  async save(chats: TelegramChat[], updatedBy: string): Promise<void> {
    await this.db
      .collection("settings")
      .doc("notifications")
      .set({ telegramChats: chats, updatedBy, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    this.cache = null;
  }
}
