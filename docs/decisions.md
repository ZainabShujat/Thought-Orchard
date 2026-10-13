# Architecture Decision Record

Decisions that shape the implementation. Product requirements live in `docs/spec.md`; this file records how and why we built them a certain way. Newest last.

---

## ADR-001: Mobile app via Capacitor (proposed)

**Date:** 2026-10-12 · **Status:** Proposed (spec OD-13)

Thought Orchard ships as an iOS and Android app (spec 17). We plan to wrap the existing React + React Three Fiber client in Capacitor rather than rewrite in React Native.

**Why:** Reuses all rendering and UI code. The pixel renderer draws at very low resolution, which keeps WebView WebGL cost low.

**Consequences:** Two build targets (deployed server with Route Handlers; client-only static export for the app). Client code must not import server modules. Auth must use tokens, not cross-origin cookies.

---

## ADR-002: Pixel art by low-resolution 3D rendering

**Date:** 2026-10-12 · **Status:** Accepted (spec 18, OD-15 resolved)

The world stays procedural 3D with a ground-relative camera and is drawn as pixel art:

- The WebGL drawing buffer is rendered small and upscaled by the browser with `image-rendering: pixelated`. The renderer pixel ratio is `devicePixelRatio / N`, where N is a whole number chosen so the screen's short side is about 240 render pixels (`rendering/pixel/usePixelRatio.ts`). Every render pixel covers N×N device pixels, so edges stay crisp.
- No anti-aliasing and no tone mapping (`flat`), so palette colours come through as authored.
- `MeshToonMaterial` with a 3-step nearest-filtered gradient gives stepped shading (`rendering/pixel/toonMaterials.ts`).
- No shadow maps; trees get flat blob shadows.

**Why this instead of a post-processing render target:** setting the drawing-buffer size directly costs nothing extra per frame, needs no extra dependency, and keeps R3F's pointer events working unchanged.

**Not done yet:** palette quantization pass and pixel outlines (spec 18.3 steps 4–5), camera pixel snapping (step 6). Add them if visual review shows they are needed.

---

## ADR-003: World layout shared by placement and rendering

**Date:** 2026-10-12 · **Status:** Accepted

Paths are defined once in `features/world/worldLayout.ts`. Placement (domain) uses it to keep trees off the paths; the ground (rendering) uses it to paint them. Placement must not depend on rendering code, so the layout lives under `features/`.

**Consequence:** changing the path layout changes where future trees can go. It never moves existing trees, because stored positions are authoritative. Bump `Orchard.placementVersion` when the layout changes once persistence exists.

---

## ADR-004: Placement algorithm

**Date:** 2026-10-12 · **Status:** Superseded by ADR-007 (landscape-aware placement). Kept for history.

Golden-angle spiral from the centre with seeded jitter. A candidate is rejected if it is within 4.8 m of another tree or within 1.6 m of a path edge. The first tree sits at the centre. The result depends only on existing positions and the seed, and existing positions are never modified. Covered by `tests/placement.test.ts`.

**Known limit:** placement is O(n) per candidate. Fine for hundreds of trees; revisit with a spatial grid if orchards grow into the thousands.

---

## ADR-005: Seven-stage trees from a pure generator

**Date:** 2026-10-12 · **Status:** Accepted (spec 4, 6.3, 18.5)

`rendering/trees/treeGenerator.ts` turns `(stage, seed)` into a list of parts (trunk, leaf clusters, blossoms, roots). Same input, same tree. The seed is `placementSeed` or a hash of the thought ID. Geometries and materials are shared module-wide; models are cached by `(stage, seed)`.

**Not decided here:** how a thought moves between stages (OD-03/OD-04). Sample data sets stages directly for review.

*Update, later the same day:* the growth model is now decided (ADR-008). Sample data no longer sets stages; it plants through the API with past dates.

---

## ADR-006: Persistence with MongoDB and a local development database

**Date:** 2026-10-12 · **Status:** Accepted (spec 9, 10; C-09)

- Official `mongodb` driver (no ODM), string UUID IDs, UTC `Date`s. Server code lives in `server/` (db, repositories, services, validation, auth) and is never imported by client code.
- `MONGODB_URI` connects to any MongoDB. Without it, **development only** starts a local MongoDB via `mongodb-memory-server` with data kept in `.data/mongo` (gitignored), so the orchard survives restarts with zero setup. Production refuses to start without `MONGODB_URI`.
- Authentication is not chosen yet (OD-01). Development runs as one configured identity (`DEV_USER_ID`, default `dev-user`). In production every API request returns 401 until real authentication exists; the server never trusts a user ID from the browser.
- **Concurrent planting:** a short-lived lock on the orchard document (`lockUntil`) serialises placement, so two plantings can't pick overlapping spots. Tested with 12 parallel plantings.
- **Idempotency:** unique indexes on `(userId, idempotencyKey)` for thoughts and care events. Retries return the original result.
- **Deletion:** thought first, then its care events; a retry clears leftovers (spec 3.4, C-32).
- *Update (ADR-011):* the development identity was removed. Every request, including in development, needs a real signed-in session; the dev routes below act on the signed-in user's own orchard.
- Dev-only routes: `POST /api/dev/seed` plants the sample orchard through the normal create and water operations with past dates; `POST /api/dev/clock` moves the server clock forward to review growth. Both return 404 in production.

---

## ADR-007: Regions, planting sites and landscape-aware placement

**Date:** 2026-10-12 · **Status:** Accepted (spec 20.5, 20.7; C-21, C-26; P-07, P-17). Supersedes ADR-004.

- `features/world/worldLayout.ts` now holds regions (circles), planting sites (groves along paths, each with a capacity), and paths as polylines. Layout version 1 has one open region (the central grove) and three reserved regions behind the forest, reached by forking paths.
- Placement tries regions in order, and sites within a region in order. Inside a site it tries seeded random candidates, then a 0.25 m grid scan, so a site is only skipped when it is really full. That keeps trees clustered in groves and sites filling in order.
- Each thought stores the `regionId` it was planted in. A region opens when placement first uses it; the forest and meadow are regenerated around open regions.
- `buildMapModel` (pure) derives the future map from the same layout and stored positions; tests check markers equal stored positions.
- Freed space after a deletion may be reused; no tree ever moves.

---

## ADR-008: Growth model version 1 (Option C)

**Date:** 2026-10-12 · **Status:** Accepted (spec 4.2–4.6; C-24, C-25, C-31). Intermediate thresholds and the 20-hour window remain proposed (P-01).

- `features/growth/growthModel.ts`: `computeGrowth(createdAt, care, now)` in integer milliseconds. `careMs = min(countedWaterings × 1 day, floor(timeMs / 2))` — the one-third cap. Thresholds 0 · 1 · 3 · 7 · 14 · 30 · 60 days.
- Nothing about growth is stored. Server and client run the same function; the client uses the server's clock offset.
- Sunlight and wind are accepted as care types with zero weight, so adding them later changes weights, not structure.
- `lightPointCount` maps stage, progress and care to canopy light points within each stage's range (spec 4.6).

---

## ADR-009: Two views from one shared pose

**Date:** 2026-10-12 · **Status:** Accepted (spec 20.1–20.4, 20.8; C-16, C-18; P-02 to P-05, P-08)

- One mutable explorer state (`rendering/movement/explorerState.ts`) holds position, heading, pitch, walk target, held keys and Explorer camera settings. It lives in a ref, not React state, because it changes every frame.
- `Navigator` moves the explorer (keys or tap-to-walk, Walk speed 1.4 m/s), resolves collisions with `features/world/collision.ts` (trunk circles plus open-region boundary, with sliding), follows the terrain, and places the camera for the current view. View switches and teleports play as a 5-step camera move (instant under reduced motion).
- Immersive: first-person at 1.6 m, 55° FOV, look −35°/+60°. This replaced the orbit camera from Phase 1R.
- Explorer: 35° FOV, 55° down, 18–40 m, follows a code-built 1.6 m character; canopies between camera and character switch to a hashed-alpha dither material.
- React's compiler lint (`react-hooks/immutability`) is disabled in `Navigator.tsx` and `OrchardCanvas.tsx` only, with a comment: the render loop and gesture handlers mutate the camera and the shared movement ref by design.

---

## ADR-010: Support resources as dated configuration

**Date:** 2026-10-12 · **Status:** Accepted (spec 23; C-30, C-33)

- `features/support/resources.ts` maps country codes to resources, each with a source and a verification date. India is first: 112, Tele-MANAS (14416 / 1-800-891-4416), Vandrevala Foundation (+91 9999 666 555), checked 2026-10-12 against findahelpline.com, the Tele-MANAS site and the Ministry of Home Affairs ERSS page.
- The country comes from `navigator.languages` (for example `en-IN`), never from location; the user can change it. Unconfigured countries get findahelpline.com.
- Entries must be re-verified before each release.

---

## ADR-011: Accounts and sessions with Better Auth on MongoDB

**Date:** 2026-10-12 · **Status:** Accepted (spec OD-01 resolved for the web app; supersedes the development identity in ADR-006)

**Decision.** Use [Better Auth](https://www.better-auth.com/) 1.7 with its MongoDB adapter and email-and-password sign-in.

**Why this option.**
- Maintained, framework-agnostic, and runs inside the existing Next.js route handlers, so there is no second backend (spec 8.1).
- Stores users, sessions and credentials in the same MongoDB that holds the orchard (C-09), so one database stays authoritative.
- Built in: password hashing (scrypt), database-backed sessions in `httpOnly` cookies, rate limiting on sign-in and sign-up, password change, account deletion with a hook, and email-based password reset and verification once an email provider is configured. A bearer-token plugin exists for the future mobile app (spec 17.4).
- Rejected: Auth.js (credentials sign-in is discouraged and limited); Lucia (deprecated); writing our own (more security surface for no gain).

**How it fits.**
- `server/auth/auth.ts` builds the Better Auth instance lazily once the database is connected. `/api/auth/[...all]` serves its endpoints.
- `currentUserId(request)` resolves the user from the session cookie on the server. A missing or expired session returns 401. The development identity (`DEV_USER_ID`) is removed.
- A database hook creates each new user's profile and private orchard at sign-up (spec 9.3: one orchard per user).
- Account deletion removes the profile, orchard, thoughts and care events before Better Auth removes the user, sessions and credentials (spec 17.4).
- Production refuses to start auth without `BETTER_AUTH_SECRET` (32+ characters), `BETTER_AUTH_URL` and `MONGODB_URI`. Secure cookies are on in production.
- `.npmrc` sets `legacy-peer-deps=true`: Better Auth declares optional peer dependencies for frameworks this app doesn't use (SvelteKit and others), which npm's strict resolver otherwise reports as conflicts.
- Email (password reset, optional verification) goes through `server/email/mailer.ts`. It uses Resend when `RESEND_API_KEY` and `EMAIL_FROM` are set. Otherwise, development prints reset links to the server console, and production reports password reset as unavailable instead of pretending to send.

---

## ADR-012: Page structure and route protection

**Date:** 2026-10-12 · **Status:** Accepted (spec 28.1)

- Route groups: `app/(app)/` (Orchard, Notebook, Map, Settings) has a server layout that checks the session on every request and sends you to `/login` without one, or to `/onboarding` if onboarding isn't finished. `app/(auth)/` (register, login, password reset) sends a signed-in visitor to the orchard. `/onboarding` checks for itself. `/` and `/support` are public and still render if the session can't be checked.
- Protection is done in server layouts, not middleware, so the same `getSessionUser` code protects pages and API routes.
- One page per job, one URL each. The orchard's in-world Notebook overlay was removed in favour of `/notebook`; the toolbar links to `/notebook` and `/map`. `?tree=<id>` and `?plant=1` let other pages open a tree or the plant sheet in the orchard.
- The orchard remembers where you stood per browser tab (`sessionStorage`), so leaving for the Notebook or Map and coming back returns you to the same spot and view. It holds no thought data.
- Preferences live in the `profiles` collection; `ProfileProvider` applies the font and motion choices. `localStorage` only mirrors the font choice so public pages can match it.

---

## ADR-013: End-to-end tests on an isolated production server

**Date:** 2026-10-12 · **Status:** Accepted (spec 13)

- `npm run test:e2e` builds the app, then `scripts/e2e-server.mjs` starts a throwaway in-memory MongoDB and `next start` on port 3100 with production settings. Tests create their own accounts, so the developer's `.data/mongo` and any real data are never touched.
- Rate limiting is off for the e2e server (one address signs in many times); it is covered by the integration tests instead.
- Chromium runs with software WebGL (SwiftShader) so the 3D scene renders headless. It is slow, so camera-transition screenshots wait several seconds.
- `e2e/visual-review.spec.ts` saves orchard scenes at phone and desktop sizes to `test-results/screens/` for the visual review (spec 20.9); `e2e/responsive.spec.ts` saves every page at 375, 768, 1366 and 1920 px.

---

## ADR-014: Forest edge and Explorer camera adjustments

**Date:** 2026-10-12 · **Status:** Accepted; art direction still subject to the product owner's review (OD-02)

- The forest around open regions is now about 85% broadleaf (tall trunk, two or three overlapping rounded crown clusters) and 15% conifer, to match the reference images (03, 05, 09), which show broadleaf woods. Previously every forest tree was a cone.
- The Explorer camera's near clipping plane is 12 m (Immersive: 0.1 m). At the closest Explorer distance the nearest visible ground is about 15 m away, so this only removes treetops directly under the camera that were filling the frame.
- On phones, a tree opened in the Immersive view is framed 22° above centre (was 14°) so it stays visible above the letter panel.
