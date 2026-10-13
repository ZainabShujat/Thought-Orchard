# Thought Orchard

A spatial web concept for non-performative thought expression: a private, procedurally generated 3D orchard where every thought becomes a tree.

This project is an early exploration. Nothing here is final. The product specification is `docs/spec.md`.

**The idea:** what if ideas were places instead of posts? There are no feeds, likes, followers or sharing. Each thought you write is planted as a tree with its own lasting place in your orchard, and it grows slowly over about two months, a little faster if you care for it.

## What works today

- **Accounts:** email and password sign-up and sign-in, with sessions stored in MongoDB. Everything you write is private to your account.
- **Planting:** write a thought and it becomes a tree, placed automatically in your orchard.
- **Growth:** seven stages, New Thought to Fully Grown. Time alone takes 60 days; watering (counted once a day) shortens it to about 40. Trees never wilt or shrink.
- **Two views:** Immersive (first person, eye level) and Explorer (third person, from above). Both work with a keyboard, mouse or touch.
- **Pages:** a Notebook to search your thoughts, a Map of the orchard's real layout, Settings (including a plain-font option and reduced motion), and a public Support page with helplines (India first).
- **Look:** a 3D world rendered as pixel art, in golden late-afternoon light with mist and fireflies. A painted look matching `docs/references/` is planned next.

**Stack:** Next.js 16, React 19, TypeScript, React Three Fiber (three.js), Tailwind CSS 4, MongoDB, Better Auth, Zod, Vitest and Playwright.

## What's in the app

| Page | Route | Notes |
|---|---|---|
| Landing | `/` | Public |
| Register / Sign in | `/register`, `/login` | Email and password |
| Password reset | `/forgot-password`, `/reset-password` | Needs an email provider in production |
| Onboarding | `/onboarding` | First sign-in: name and preferences |
| Orchard | `/orchard` | The 3D world: Immersive and Explorer views |
| Notebook | `/notebook` | Every thought as a searchable list |
| Map | `/map` | The orchard's real layout and tree positions |
| Settings | `/settings` | Preferences, password, log out, delete account |
| Support | `/support` | Public; helplines (India first) |
| About, How to use, All pages | `/about`, `/how-to-use`, `/navigation` | Public guides; also in the ⋯ menu on every top bar |

## Local development

Requirements: Node.js 20 or newer (tested with 24).

```bash
npm install
npm run dev
```

Open http://localhost:3000 and create an account.

- **Database:** with no `MONGODB_URI`, development starts a local MongoDB automatically and keeps its data in `.data/mongo` (gitignored). To use your own, put `MONGODB_URI=...` in `.env.local`.
- **Auth secret:** development uses a built-in development-only secret if `BETTER_AUTH_SECRET` is unset (a warning is printed). Production never does.
- **Email:** without an email provider, password-reset links are printed to the dev server's console.

Development-only helpers (they act on the signed-in account; both return 404 in production):

- `POST /api/dev/seed` plants sample thoughts at every growth stage, if your orchard is empty.
- `POST /api/dev/clock` with `{"offsetDays": 10}` moves the server clock forward to see growth.

Call them from the browser console while signed in, for example:

```js
fetch("/api/dev/seed", { method: "POST" }).then((r) => r.json())
```

### Sample accounts

```bash
npm run db:seed
```

creates four local test accounts with orchards at different ages (a full review orchard showing every growth stage, a newcomer who hasn't finished onboarding, a few-days-old orchard, and a large grove). Their emails and passwords are in `scripts/sampleUsers.ts`. Stop `npm run dev` first when using the built-in `.data/mongo` database. Running it again keeps existing accounts and orchards as they are. It refuses to run in production or against a non-local `MONGODB_URI`.

`npm install` uses `legacy-peer-deps` (set in `.npmrc`) because the auth library lists optional peer dependencies for frameworks this app doesn't use.

## Configuration

Copy `.env.example` to `.env.local` for development, or set the same variables in your host for production. **Never commit real values.**

| Variable | Required in production | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `MONGODB_DB` | No (default `thought_orchard`) | Database name |
| `MONGODB_TRANSACTIONS` | No | `true` only for a replica set such as MongoDB Atlas |
| `BETTER_AUTH_SECRET` | Yes, 32+ characters | Signs sessions. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `BETTER_AUTH_URL` | Yes | Public URL of the app, e.g. `https://orchard.example.com` |
| `TRUSTED_ORIGINS` | No | Extra allowed origins, comma-separated |
| `AUTH_RATE_LIMIT` | No (default `on`) | Rate limits on sign-in, sign-up, password reset |
| `RESEND_API_KEY`, `EMAIL_FROM` | For password reset | Email via [Resend](https://resend.com) |
| `REQUIRE_EMAIL_VERIFICATION` | No | `true` requires confirming email before first sign-in (needs email configured) |

If a required variable is missing in production, the app does not start half-configured: auth and data routes answer `503` and the server log names the missing variables (never their values).

## Database

MongoDB is the only database: accounts, sessions, profiles, orchards, thoughts and care history.

Indexes are created automatically on every connection. To create them before the first deploy (safe to repeat):

```bash
MONGODB_URI="mongodb+srv://..." npm run db:init
```

There are no other migrations; collections are created on first write. The collections and their indexes are listed in `docs/spec.md` section 28.3.

## Tests

```bash
npm run typecheck
npm run lint
npm test            # unit + database integration + auth/security tests (in-memory MongoDB)
npm run test:e2e    # production build, then Playwright on an isolated server and database
```

- The first run downloads a MongoDB binary and, for e2e, run `npx playwright install chromium` once.
- No test touches `.data/mongo` or any real data: integration tests use a fresh in-memory database, and e2e starts its own server on port 3100 with a throwaway database (`scripts/e2e-server.mjs`).
- `npm run test:e2e` saves screenshots of every page at 375, 768, 1366 and 1920 px, plus orchard scenes for visual review, to `test-results/screens/`.

## Production build and deployment

```bash
npm run build
npm start          # serves on port 3000 (set PORT to change)
```

Deployment checklist. The app is a standard Next.js server, so it should run on any Node.js host that can run `next start`; it has not yet been deployed or tested on any particular host.

1. Create a MongoDB database (MongoDB Atlas free tier works) and a database user. Allow your host's IP addresses in Atlas network access.
2. Set `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (your HTTPS URL), and `MONGODB_TRANSACTIONS=true` for Atlas.
3. Optional: set `RESEND_API_KEY` and `EMAIL_FROM` with a domain verified in Resend, so password reset works.
4. Run `npm run db:init` once against the production database.
5. Build and start. Serve over HTTPS; session cookies are `Secure` in production.
6. Check: open `/`, register, plant a thought, sign out, sign back in.

**Not yet done:** no deployment has been made and no email provider has been configured or tested. Hosting is an open decision (spec OD-10).

## Promo trailer

`promo/` holds the production notes and title cards for a 60-second trailer made from real footage of the app. The video files themselves (`promo/*.mp4`, about 21 MB each) are kept out of git; share them separately.

## Documents

- `docs/spec.md` — product specification, decision register, page and exit-criteria status
- `docs/decisions.md` — architecture decision records
- `docs/journal/` — development journal
- `docs/references/` — design references
- `CHANGELOG.md`
