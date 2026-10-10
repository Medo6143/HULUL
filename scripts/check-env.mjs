// Reports which settings are filled, missing, or malformed. It NEVER prints a value.
//
//   npm run check:env
//
// Reads .env, then .env.local on top (like Next.js does). Exit code 1 if a required item is missing.
import { existsSync, readFileSync } from "node:fs";

function load(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    let value = line.slice(eq + 1).trim();
    if (!value.startsWith('"') && !value.startsWith("'")) value = value.split(/\s+#/)[0].trim();
    out[line.slice(0, eq).trim()] = value.replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...load(".env"), ...load(".env.local"), ...process.env };
const get = (name) => (env[name] ?? "").trim();

const checks = [
  // [group, name, required, validator(value) -> problem string | null]
  ["Site", "NEXT_PUBLIC_SITE_URL", true, (v) => (/^https:\/\//.test(v) && !/example\.com|localhost/.test(v) ? null : "still a placeholder or not https (crawlers stay blocked)")],
  ["Site", "NEXT_PUBLIC_WHATSAPP_NUMBER", true, (v) => (/^[1-9]\d{7,14}$/.test(v) ? null : "must be digits only with country code")],
  ["Firebase web", "NEXT_PUBLIC_FIREBASE_API_KEY", true, (v) => (v.length > 20 ? null : "looks too short")],
  ["Firebase web", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", true],
  ["Firebase web", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", true],
  ["Firebase web", "NEXT_PUBLIC_FIREBASE_APP_ID", true],
  ["Firebase admin", "FIREBASE_ADMIN_PROJECT_ID", true],
  ["Firebase admin", "FIREBASE_ADMIN_CLIENT_EMAIL", true, (v) => (/@.*\.iam\.gserviceaccount\.com$/.test(v) ? null : "should end with .iam.gserviceaccount.com")],
  ["Firebase admin", "FIREBASE_ADMIN_PRIVATE_KEY", true, (v) => (v.includes("BEGIN PRIVATE KEY") ? null : "should contain BEGIN PRIVATE KEY")],
  ["Spam protection", "NEXT_PUBLIC_APPCHECK_RECAPTCHA_SITE_KEY", false],
  ["Spam protection", "APPCHECK_RECAPTCHA_SECRET", false],
  ["Email", "RESEND_API_KEY", true, (v) => (v.startsWith("re_") ? null : 'Resend keys start with "re_"')],
  ["Email", "EMAIL_FROM", true, (v) => (/@/.test(v) ? null : "needs an email address")],
  ["Email", "TEAM_ALERT_EMAIL", true, (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "not a valid email")],
  ["Images", "CLOUDINARY_CLOUD_NAME", false],
  ["Images", "CLOUDINARY_API_KEY", false],
  ["Images", "CLOUDINARY_API_SECRET", false],
  ["Anti-abuse", "RATE_LIMIT_SALT", true, (v) => (v.length >= 16 ? null : "use at least 16 random characters")],
  ["Analytics", "NEXT_PUBLIC_GA4_ID", false, (v) => (/^G-[A-Z0-9]{4,20}$/.test(v) ? null : "expected G-XXXXXXXXXX")],
  ["Analytics", "NEXT_PUBLIC_CLARITY_ID", false],
];

let missing = 0;
let group = "";
for (const [g, name, required, validate] of checks) {
  if (g !== group) {
    group = g;
    console.log(`\n${g}`);
  }
  const value = get(name);
  let status;
  if (!value) {
    status = required ? "MISSING " : "empty   ";
    if (required) missing += 1;
  } else {
    const problem = validate ? validate(value) : null;
    status = problem ? `CHECK   (${problem})` : "ok      ";
    if (problem && required) missing += 1;
  }
  console.log(`  ${status} ${name}`);
}

if (get("ADMIN_DEMO") === "1") {
  console.log("\nNote: ADMIN_DEMO=1 is set. The admin shows sample data. Remove it to see real data (ignored in production).");
}
console.log(missing === 0 ? "\nAll required settings look fine." : `\n${missing} required item(s) still need attention.`);
process.exit(missing === 0 ? 0 : 1);
