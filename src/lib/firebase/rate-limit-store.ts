import "server-only";
import { createHash } from "node:crypto";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

type App = Parameters<typeof getFirestore>[0];

/**
 * Fixed-window counter in Firestore, shared by every serverless instance.
 * Add a TTL policy on `rateLimits.expiresAt` in the Firebase console so old windows are deleted.
 */
export function createFirestoreRateLimiter(app: App, opts: { name: string; limit: number; windowMs: number }) {
  const db = getFirestore(app);

  return async function allow(key: string, now: number = Date.now()): Promise<boolean> {
    const windowStart = Math.floor(now / opts.windowMs) * opts.windowMs;
    const id = createHash("sha256").update(`${opts.name}:${key}:${windowStart}`).digest("hex");
    const ref = db.collection("rateLimits").doc(id);

    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const count = snap.exists ? ((snap.data()?.count as number) ?? 0) : 0;
      if (count >= opts.limit) return false;
      tx.set(ref, {
        name: opts.name,
        count: count + 1,
        expiresAt: Timestamp.fromMillis(windowStart + opts.windowMs * 2),
      });
      return true;
    });
  };
}
