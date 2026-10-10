// Publishes firestore.rules to the project in .env.local using the service account (no `firebase login` needed).
//
//   node --env-file=.env.local scripts/deploy-rules.mjs
//
// Indexes (firestore.indexes.json) still need the Firebase CLI: npx firebase-tools deploy --only firestore:indexes
import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getSecurityRules } from "firebase-admin/security-rules";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_* values. Run `npm run check:env`.");
  process.exit(1);
}

const source = readFileSync("firestore.rules", "utf8");
const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

try {
  const ruleset = await getSecurityRules(app).releaseFirestoreRulesetFromSource(source);
  console.log(`Firestore rules published to ${projectId} (ruleset ${ruleset.name.split("/").pop()}).`);
} catch (error) {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
}
