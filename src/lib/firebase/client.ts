import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { publicEnv } from "../env.public";

export function getFirebaseApp(): FirebaseApp {
  const apiKey = publicEnv.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId || !publicEnv.NEXT_PUBLIC_FIREBASE_APP_ID) {
    throw new Error(
      "Firebase client is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID, and NEXT_PUBLIC_FIREBASE_APP_ID.",
    );
  }

  const existing = getApps()[0];
  if (existing) return existing;

  return initializeApp({
    apiKey,
    authDomain: publicEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: publicEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: publicEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: publicEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}
