# Changelog

All notable changes to the Thought Orchard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Guides and navigation

### Added
- **About** (`/about`), **How to use** (`/how-to-use`) and **All pages** (`/navigation`): public pages, reachable from the home screen, the sign-in pages and the orchard's More menu.
- **⋯ site menu** in the top bar of the home screen, the app pages and the guide pages, listing every page (different lists signed in and signed out).
- End-to-end tests for the guides and the menu; the new pages are included in the four-size layout check.

## [0.4.0] - Complete application: accounts and pages

### Added
- **Accounts (ADR-011):** Better Auth on MongoDB. Register, sign in, sign out, 30-day database sessions in httpOnly cookies (Secure in production), password change, password reset (email via Resend when configured), sign out of other devices, account deletion that removes all orchard data. Rate limits on sign-in, sign-up, reset, password change and deletion.
- **Profiles:** display name and preferences (plain font, motion, starting view) stored per account; each new account gets one private orchard automatically.
- **Pages (ADR-012):** `/register`, `/login`, `/forgot-password`, `/reset-password`, `/onboarding`, `/notebook` (with search), `/map` (drawn from the world data, tap a tree to visit it), `/settings`, plus not-found and error pages. The landing page adapts when signed in; support is public.
- **Production safety:** configuration check (missing secrets → 503, names only in logs); `no-store` on private API responses; dev seed and clock routes 404 in production and require a session in development.
- **Database:** indexes for auth collections (unique email and token, TTL on expired sessions) and `npm run db:init`.
- **Tests:** 22 auth and security integration tests (cookies, expiry, tampering, isolation, reset, deletion, rate limiting, production config); API tests now use real sign-up; Playwright suite on an isolated production server: full user journey, two-account isolation, access control, cookies, support, keyboard, orchard views, four viewport sizes, visual-review scenes.
- `.env.example`, deployment and configuration documentation in the README.
- `npm run db:seed` creates four sample accounts in the local development database (a full review orchard, a not-yet-onboarded newcomer, a few-days-old orchard and a large grove) through the real sign-up, planting and watering paths. Development-only; refuses production and non-local databases.

### Changed
- **Landing page** rebuilt to match references 07 and 08 in pixel art: a live code-built scene down a path to a glowing thought-tree under light shafts, with fireflies and broadleaf woods; cream title, parchment "Enter forest" and "View map" buttons, top bar with Support, Log in and Sign up (`components/landing/LandingScene.tsx`).
- The development identity (`DEV_USER_ID`) is gone; every request needs a real session.
- The orchard toolbar: Notebook · Map · Plant · View · More (Back to the path, Settings, Support, Log out). The in-world Notebook overlay became the `/notebook` page.
- Your position and view in the orchard are remembered for the browser tab when you visit other pages.
- Font and motion preferences come from the account profile instead of `localStorage`.
- Forest edge is mostly broadleaf, to match the references (ADR-014).
- Explorer camera clips treetops directly beneath it; small trees on phones are framed higher above the letter panel (ADR-014).

### Removed
- `lib/useReadableFont.ts`, `components/thoughts/ThoughtNotebook.tsx` (replaced by profile preferences and the Notebook page), the dev-server end-to-end spec (replaced by the isolated suite).

## [0.3.0] - Milestone 1: foundation

### Added
- **Persistence (ADR-006):** MongoDB via the official driver; `MONGODB_URI`, or a zero-setup local development database in `.data/mongo`. API: create (idempotent), list, get, edit, permanent delete, water (idempotent). Ownership on every query; placement lock for concurrent plantings; Zod validation; consistent JSON errors that never log thought text. Dev-only `/api/dev/seed` and `/api/dev/clock`.
- **World foundation (ADR-007):** regions, planting sites and polyline paths; landscape-aware placement filling groves in order; `regionId` on thoughts; `buildMapModel` for the future map; forest regenerated around open regions; path-side bushes.
- **Growth (ADR-008):** Option C model, computed on every read; within-stage fullness; canopy light points by stage and care; stepped grow animation on a stage change.
- **Views and movement (ADR-009):** first-person Immersive view; overhead Explorer view with a code-built explorer character; shared pose and stepped view switching; tap-to-walk, WASD, drag to look, pinch and twist in Explorer; trunk and boundary collision with sliding; terrain following; "Back to the path".
- **Mood pass:** banded golden sky, sage-gold mist, blinking fireflies, warm light points; lighting from a single `timeOfDay` preset.
- **Tending:** Water, Edit and two-step permanent Delete in the letter panel and the Notebook; droplets and leaf brightening after a confirmed watering; care history dates; retries reuse the same request key.
- **Support page (ADR-010):** country from device settings; India resources (112, Tele-MANAS, Vandrevala Foundation) with sources and check dates; findahelpline.com fallback.
- **Accessibility:** focus trapping in dialogs; Notebook reaches every action; keyboard walking.
- **Tests:** growth (worked examples, monotonicity), placement (sites, regions, spacing, paths), map model, collision, support config, API integration against in-memory MongoDB (ownership, idempotency, deletion, concurrency), Playwright end-to-end core loop. `npm test`, `npm run test:e2e`.
- `docs/references/2026-10-12/` (13 reference images), `docs/journal/` with a factual build entry.

### Changed
- Spec v2.4: OD-28 (Option C), OD-07 (permanent deletion) and OD-26 (India first) resolved; decision register updated.
- Journal renamed Notebook; toolbar is Notebook, Plant, View, Path, More (font setting, support, entrance).
- The thought panel sits to the right on wide screens so the tree stays visible.
- Thoughts no longer store a growth stage; sample data is planted through the API with past dates.

### Removed
- The orbit camera (`rendering/camera/OrchardCamera.tsx`), replaced by the two views.

## [0.2.0] - Phase 1R: Pixel world and touch foundation

### Added
- **Pixel-art renderer**: the scene renders at about 240 px on the short side and upscales with hard pixel edges, at a whole-number scale (`rendering/pixel/usePixelRatio.ts`). Toon materials with 3-step shading, shared palette (`rendering/pixel/palette.ts`), no anti-aliasing or tone mapping.
- **Seven growth stages**: New Thought, Seedling, Budding, Young Tree, Blossoming, Flourishing, Fully Grown, generated from `(stage, seed)` with per-tree variation in form, colour, blossoms and fruit (`rendering/trees/treeGenerator.ts`).
- **World layout** shared by placement and rendering: a clearing ring and an entry path (`features/world/worldLayout.ts`); a forest edge, clustered grass and wildflowers.
- **Ground-relative touch camera**: one finger walks, pinch zooms, two-finger twist turns; left-drag/right-drag/wheel on desktop. Taps that move more than 8 px never select a tree. Closing a thought keeps the camera where it is; an Overview button returns to the default view. Eye height and look-at point are clamped.
- **Pixel UI kit**: Pixelify Sans (self-hosted), notched-corner wood and parchment panels, pixel buttons that press down one pixel, icons defined in code as pixel grids (`components/ui/`).
- **New UI**: wooden sign HUD, bottom toolbar (Journal, Plant, Overview, Text), letter-style thought panel with type-out text, journal list, plant sheet that keeps the draft when closed.
- **Readability setting**: switch all text to a plain font; saved on the device.
- **Unit tests** (Vitest): placement determinism, stability, spacing and path clearance; tree determinism and stage heights; icon grids; pixel-ratio maths. Run with `npm test`.
- `docs/decisions.md` architecture decision record.

### Changed
- **Spec v2.3** (second review): time and care kept separate in the growth model, growth values marked as initial; seven-stage appearance table and within-stage changes (4.6); the watering interaction step by step (5.5); deletion in Milestone 1 (3.4); landscape-aware placement with planting sites (20.7); a visual review in the running build as a Milestone 1 exit criterion (20.9); country-appropriate support resources (23); decision register split into confirmed, proposed, unresolved, deferred and excluded lists.
- **Spec v2.2** (milestone review): proposed growth model with care history and visual changes (4.2–4.5); `regionId` and `growthModelVersion` in the data model; care endpoint response; exact scale, perspective, movement and collision rules for the Immersive and Explorer views; map model and regions in the architecture from Milestone 1; Milestone 1 redefined as a foundation milestone around the core loop; decision register separating confirmed, proposed, open, deferred and excluded items with sources (27).
- Design references preserved in `docs/references/2026-10-12/` with an index.
- **Spec v2.1**: adds the full-vision inventory: pixel art with the reference paintings' mood (18.9); Immersive and Explorer views with an explorer character, map, movement modes and regions (20); time and atmosphere (21); interface inventory with Notebook and Settings (22); a support page (23); development journal rules (24); a proposed split between Milestone 1 and later vision (25); a 13-area audit checklist (26); open decisions OD-19 to OD-27. Adds `docs/journal/` scaffold.
- **Spec v2.0** is now `docs/spec.md`; v1.0 is archived in `docs/archive/`. Adds the mobile app (section 17), pixel-art direction (18), repository audit and revised roadmap (19), and reconciles earlier sections with them.
- `GrowthStage` now has the seven canonical stages.
- Placement keeps trees off paths and uses a shared seeded RNG (`lib/random.ts`).
- Shadow maps replaced by blob shadows; path slabs replaced by paths painted into the terrain.

### Fixed
- `ensureThoughtPositions` no longer moves a thought whose stored position is exactly `(0, 0)`.
- Escape now closes only the topmost layer (sheet, then thought), instead of every open layer at once.

### Removed
- `OrchardHeader`, `PlantThoughtModal`, `AccessibleThoughtList`, `ThoughtDetailModal` (replaced by the pixel UI above), `lucide-react` usage, leftover starter CSS.

## [0.1.0] - Phase 1: 3D Rendering Prototype - 2026-10-12

### Added
- **Three.js & React Three Fiber Setup**: Installed `@react-three/fiber`, `@react-three/drei`, `three`, `@types/three`, and `lucide-react`.
- **Procedural 3D Orchard Canvas (`rendering/OrchardCanvas.tsx`)**:
  - Full-screen interactive WebGL viewport with ACESFilmic tone mapping and shadow support.
  - Hardware-detection WebGL fallback view and calm loading spinner state.
- **Procedural Terrain & Environment (`rendering/environment/Ground.tsx`)**:
  - Subdivided organic plane with code-generated undulating elevation using trigonometric height functions.
  - Instanced procedural meadow grass tufts with randomized scales and natural green gradients.
  - Meandering stepping stones and paths leading through the orchard clearing.
- **Atmospheric Lighting & Fog (`rendering/scene/Atmosphere.tsx`)**:
  - Directional sunlight casting soft shadows across the orchard.
  - Soft ambient hemisphere light balancing sky and earth tones.
  - Atmospheric depth fog (`fogExp2`) matching the orchard's calm sage palette.
  - Floating ambient pollen/motes with subtle procedural drifting.
- **Procedural Tree Architecture (`rendering/trees/ProceduralTree.tsx`)**:
  - Three distinct growth stages generated entirely in code:
    - **Sapling**: Slender curved stem, lateral branch fork, tender lime foliage.
    - **Young**: Developing tapered trunk, dual spreading branches, balanced crown foliage.
    - **Mature**: Sturdy trunk with root flares, multi-limbed structural branches, layered organic canopy.
  - Gentle breeze micro-animations with coordinate-offset sway.
  - Interactive hover halos, cursor feedback, and selected luminous base rings with beacon lighting.
  - Invisible cylindrical hit targets for reliable pointer selection on both desktop and touch devices.
- **Camera Navigation (`rendering/camera/OrchardCamera.tsx`)**:
  - Damped orbit controls bounded against ground clipping (`maxPolarAngle`).
  - Smooth camera target gliding and interpolation when selecting trees or returning to orchard center.
- **Collision-Aware Placement Service (`features/placement/placementService.ts`)**:
  - Golden-angle phyllotaxis algorithm with ring expansion and collision avoidance.
  - Enforces minimum spacing threshold (4.5 units) to prevent tree overlap.
  - Deterministic and stable: adding new thoughts does not disturb existing tree coordinates.
- **Domain Models & Seed Data (`types/thought.ts`, `features/thoughts/sampleThoughts.ts`)**:
  - Typed `Thought`, `ThoughtPosition`, `GrowthStage`, and `OrchardMetadata` interfaces.
  - 7 seeded thoughts spanning sapling, young, and mature stages with philosophical reflections.
- **Orchard Interface & Accessibility (`components/`)**:
  - Top HUD header (`OrchardHeader.tsx`) showing tree count, back navigation, and action buttons.
  - Focused thought detail card (`ThoughtDetailModal.tsx`) showing thought content, creation date, and growth stage.
  - Fully accessible thought index modal (`AccessibleThoughtList.tsx`) providing keyboard-navigable and screen-reader accessible alternatives to the 3D scene.
  - In-memory thought composition and planting modal (`PlantThoughtModal.tsx`) for testing live tree spawning and placement.
