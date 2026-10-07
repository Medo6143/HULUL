import "server-only";
import { serverEnv } from "../env.server";

export async function getAdminApp() {
  const projectId = serverEnv.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = serverEnv.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = serverEnv.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }

  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const existing = getApps()[0];
  if (existing) return existing;

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}
