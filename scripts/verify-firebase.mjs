// Read-only connection test for the Admin SDK settings in .env.local. Writes nothing and prints no secrets.
//
//   node --env-file=.env.local scripts/verify-firebase.mjs
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_* values. Run `npm run check:env`.");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
let failed = false;

try {
  const collections = await getFirestore(app).listCollections();
  console.log(`Firestore: connected (${collections.length} collection(s) so far)`);
} catch (error) {
  failed = true;
  console.error("Firestore: FAILED -", error instanceof Error ? error.message : error);
}

try {
  const { users } = await getAuth(app).listUsers(10);
  console.log(`Auth: connected (${users.length} user(s))`);
  for (const user of users) {
    const role = user.customClaims?.role ?? "no role";
    console.log(`  - ${user.email ?? user.uid}: ${role}`);
  }
} catch (error) {
  failed = true;
  console.error("Auth: FAILED -", error instanceof Error ? error.message : error);
}

process.exit(failed ? 1 : 0);
