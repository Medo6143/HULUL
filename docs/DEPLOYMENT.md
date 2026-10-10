# Deployment guide

Everything here needs accounts and values that only the owner can supply. Do the steps in order, once per environment (`dev`, `staging`, `prod`). Use a separate Firebase project and separate keys for each.

## 1. Firebase project

1. Create the project in the Firebase console.
2. **Firestore**: create the database in the Riyadh or nearest region.
3. **Authentication**: enable the Email/Password provider.
4. **Service account**: Project settings, Service accounts, generate a private key. Its three values become `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY` (keep the `\n` escapes, wrap in quotes).
5. **Web app**: Project settings, Your apps, add a web app. Its config fills the `NEXT_PUBLIC_FIREBASE_*` values (only the API key is used, for staff sign-in).
6. Deploy rules and indexes:
   ```bash
   npx firebase-tools deploy --only firestore --project <project-id>
   ```
7. **TTL policy** (Firestore, Time-to-live): add one on collection `rateLimits`, field `expiresAt`, so old rate limit windows are deleted. Optionally add one on `notificationLogs` if you want logs to expire.
8. Check the rules before and after any change:
   ```bash
   npm run test:rules
   ```

## 2. Staff accounts

1. Create the user in Authentication, Users, with a strong password.
2. Give the user a role (run locally with the same service account values in `.env.local`):
   ```bash
   node --env-file=.env.local scripts/set-admin-claim.mjs person@company.com owner
   ```
   Roles are `owner` and `agent`. `none` removes access. The user signs in again afterwards.
3. Sign in at `/admin/login`. Sessions last 5 days and are httpOnly cookies.

`ADMIN_DEMO=1` only works outside production and shows sample data. Never set it on a deployed environment.

## 3. Spam protection (reCAPTCHA v3)

Create a reCAPTCHA v3 key pair for the domain. The site key goes in `NEXT_PUBLIC_APPCHECK_RECAPTCHA_SITE_KEY`, the secret in `APPCHECK_RECAPTCHA_SECRET`. Without the secret the check is skipped (fine locally, not for production). Mention reCAPTCHA in the privacy policy.

## 4. Email (Resend)

1. Add and verify the sending domain in Resend (SPF and DKIM records at the DNS provider).
2. `RESEND_API_KEY`, `EMAIL_FROM` (for example `HULOL TECH <hello@your-domain>`), `TEAM_ALERT_EMAIL`.
3. Optional team chat alert: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.

Every attempt is recorded in the `notificationLogs` collection, with its status (`sent`, `failed`, `skipped`). A skipped entry means the channel is not configured.

## 5. Hosting (Vercel)

1. Import the repository, framework Next.js, Node 22.
2. Add every variable from `.env.example` per environment. `NEXT_PUBLIC_SITE_URL` must be the real `https://` domain: while it is `example.com` or localhost, `robots.txt` blocks all crawlers on purpose.
3. Attach the domain and wait for the certificate. HSTS and the security headers are sent by the app in production.
4. `RATE_LIMIT_SALT` is a long random string, different per environment.

## 6. Analytics and search

Fill the ids you actually use. Empty or malformed ids are ignored, and nothing loads before the visitor consents.

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_GA4_ID` | GA4 data stream, `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_CLARITY_ID` | Clarity project id. Mask all form fields in the Clarity settings |
| `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_SNAP_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | The ad accounts, only if you run ads |

After deploying: verify the site in Search Console, submit `/sitemap.xml`, and check events in GA4 DebugView (`generate_lead`, `whatsapp_click`, `cta_click`, `form_start`).

## 7. Launch gate

- [ ] `npm run check` is green, and the CI jobs (checks, rules, Lighthouse, secret scan) pass.
- [ ] A test request from the live domain reaches Firestore, the team inbox, and the confirmation inbox.
- [ ] The admin shows that lead, and a status change plus a note are saved.
- [ ] `robots.txt` allows crawling and `sitemap.xml` shows the real domain.
- [ ] Legal pages are reviewed and the `noindex` on them is removed.
- [ ] Commercial registration, VAT number, national address, official email, and phone are in `src/config/site.ts`.
- [ ] Real photos, case studies, and testimonials (with consent) replace the placeholders, or those sections stay hidden.
- [ ] The first-reply limit is decided and set in `src/config/sla.ts`.
