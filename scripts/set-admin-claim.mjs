// Gives an existing Firebase Auth user the staff role that unlocks the admin dashboard.
//
//   node --env-file=.env.local scripts/set-admin-claim.mjs user@example.com owner
//   node --env-file=.env.local scripts/set-admin-claim.mjs user@example.com agent
//   node --env-file=.env.local scripts/set-admin-claim.mjs user@example.com none     (removes access)
//
// Needs FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in the environment.
// Create the user first in the Firebase console (Authentication > Users). Sessions of that user are revoked so the
// new role applies on the next sign in.
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [email, role] = process.argv.slice(2);
const roles = ["owner", "agent", "none"];

if (!email || !roles.includes(role)) {
  console.error("Usage: node --env-file=.env.local scripts/set-admin-claim.mjs <email> <owner|agent|none>");
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL or FIREBASE_ADMIN_PRIVATE_KEY.");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);

try {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, role === "none" ? {} : { role });
  await auth.revokeRefreshTokens(user.uid);
  console.log(`${email} (${user.uid}) is now: ${role}`);
} catch (error) {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
}
