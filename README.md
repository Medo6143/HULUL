# HULOL TECH

Arabic-first marketing site for حلول تك. The specification lives in `pack/` and is the source of truth.

## Run

```bash
npm install
npm run dev
```

Open `/` to land on `/ar`. English is `/en`.

Placeholder environment values are in `.env`. Put real secrets in `.env.local`. The app stops at startup if `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_DEFAULT_LOCALE` is missing or invalid.

## Checks

```bash
npm run check
```

That runs lint, types, unit tests, emoji scan, i18n key parity, the logical-direction rule, the layer-boundary rule, and the production build.

## Lead intake

- Page: `/ar/start` and `/en/start` (single-page form; `/consultation` and the home page reuse it).
- API: `POST /api/leads`. Success is `201 {"ok":true}`. Failure is `{"ok":false,"error":{"code","message_key"}}`.
- Writes go through Firebase Admin only. `FIREBASE_ADMIN_*` must be set for the route to succeed; without them it answers `500 internal_error`.
- Design notes and open gaps: `docs/adr/0007-lead-intake.md`.
