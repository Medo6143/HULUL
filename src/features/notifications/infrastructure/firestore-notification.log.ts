import { getFirestore, Timestamp, type Firestore } from "firebase-admin/firestore";
import type { NotificationLog, NotificationLogEntry } from "../application/ports";

type App = Parameters<typeof getFirestore>[0];

export class FirestoreNotificationLog implements NotificationLog {
  private readonly db: Firestore;

  constructor(app: App) {
    this.db = getFirestore(app);
  }

  async record(entry: NotificationLogEntry): Promise<void> {
    await this.db.collection("notificationLogs").add({
      channel: entry.channel,
      event: entry.event,
      subjectId: entry.subjectId,
      status: entry.status,
      error: entry.error,
      at: Timestamp.fromDate(entry.at),
    });
  }
}
