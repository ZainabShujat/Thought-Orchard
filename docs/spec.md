# Thought Orchard
## Product Specification and Implementation Plan

**Version:** 2.5  
**Status:** Canonical specification (2026-10-12). Supersedes v1.0 (archived at `docs/archive/spec-v1.0.md`) and v1.1. Version 2.0 added the mobile app and pixel-art direction (sections 17–19). Version 2.1 adds the full-vision inventory: two view modes, map and regions, movement, time and atmosphere, a support page, the development journal, and a split between the full vision and the first milestone (sections 20–26). Version 2.2 (milestone review) defines the growth model (4.2–4.5), exact rules for both views, map and region architecture from the start, Milestone 1 as a foundation milestone, and a decision register (27). Version 2.5 adds real accounts (Better Auth on MongoDB), onboarding, and separate Notebook, Map and Settings pages (section 28). Version 2.4 resolves growth strength (Option C), permanent deletion, and India as the first support country. Version 2.3 (second review) separates time and care in the growth model, specifies the watering interaction and stage appearances, adds landscape-aware placement, a visual-review gate, deletion in Milestone 1, and country-appropriate support resources.  
**Product type:** Personal, private, spatial thought-journaling application  
**Primary platform:** Mobile app (iOS and Android); the web build remains for development and as a secondary client — see section 17  
**Art direction:** Pixel art (cozy farming-game feel) carrying the mood of the reference paintings: warm golden light, mist, fireflies, glowing thought-trees — see sections 18 and 18.9  
**How to read this spec:** Section 27 lists every requirement as confirmed, proposed, open, deferred or excluded, with its source. Section 25 says what Milestone 1 builds. Anything not in Milestone 1 is not a build requirement yet. Older sections (1–19) are kept with their original wording; later sections note where they change them.  
**Architecture:** Next.js, React, TypeScript, React Three Fiber, Three.js, MongoDB, Capacitor (proposed mobile shell)  
**Core principle:** Ideas should have a place to exist without needing to perform.

---

## 1. Product vision

### 1.1 The idea

**What if ideas were places instead of posts?**

Thought Orchard is a personal digital landscape where every thought becomes a persistent tree. The user can move through the orchard, discover and revisit thoughts, nurture trees through symbolic interactions, and see the landscape change over time.

Unlike a conventional notes application, thoughts have spatial identity. Unlike a social network, the experience does not depend on public engagement, popularity, or a continuously ranked feed.

> Twitter is a conversation. Thought Orchard is a memory landscape.

Thought Orchard began with discomfort about what happens to thoughts online: a thought becomes content to be reacted to, measured, ranked, and anticipated. The product explores whether design can give thoughts a place to exist without that performance pressure.

The orchard is not a forest image behind a website. **The world itself is the primary interface.** Terrain, trees, paths, vegetation, camera movement, growth, and care must form one coherent environment.

### 1.2 Product goals

1. Make capturing a thought quick and low-pressure.
2. Give each thought a persistent identity and spatial presence.
3. Make revisiting a thought feel like returning to a place.
4. Build an immersive, procedural 3D orchard from code-generated geometry and materials.
5. Make growth legible through meaningful visual differences.
6. Make care interactions tangible without turning them into chores or engagement mechanics.
7. Preserve thought content, identity, placement, and care history reliably.
8. Keep the experience personal, private, calm, and accessible.

### 1.3 Non-goals

Version 1 is not:
- A social media feed or public discussion platform.
- A productivity or task-management dashboard.
- A streak-based journaling product.
- A popularity or engagement-ranking system.
- An AI-generated quote garden.
- A multiplayer world.
- A simulation that punishes absence by killing or degrading trees.

No likes, followers, replies, comments, reposts, public rankings, streaks, or engagement-driven notifications.

---

## 2. Decision status and scope

### 2.1 Confirmed requirements

These decisions are locked unless the product owner explicitly changes them.

| Area | Confirmed requirement |
|---|---|
| Scope | One personal orchard per user in the initial product |
| Privacy | Private by default |
| Primary experience | Interactive 3D orchard |
| Rendering | Code-generated 3D environment using Three.js / React Three Fiber |
| Persistence | Backend and database; database is authoritative |
| Database | MongoDB |
| Thought lifecycle | Create, read, and edit thoughts |
| Editing | Editing is supported and must preserve identity, original creation time, position, and care history |
| Placement | Automatically assigned; no manual tree arrangement in v1 |
| Layout | Fixed spatial placement: once assigned, a tree does not move when the orchard reloads or new thoughts are planted |
| Environment | Geometry and materials generated in code; static landscape images cannot substitute for the world |
| Care | Watering is the first implemented care interaction |
| Growth | Seven conceptual growth stages must be represented in the product model and visual design |
| Camera (v2.1) | Two views of the same 3D world: **Immersive** (first-person at eye level, trees tower above you, no avatar) and **Explorer** (overhead third-person with a visible explorer character). See section 20 |
| Accessibility | A keyboard-accessible alternative to 3D-only thought selection |
| Architecture | Separate rendering, domain logic, API, and persistence responsibilities |
| Platform (v1.2) | Installable iOS and Android app; web build retained (section 17) |
| Visual style (v2.1) | Pixel-art, cozy farming-game look and feel applied to the 3D world and the UI, with the warm, misty, firefly-lit mood of the reference paintings (sections 18, 18.9) |
| Support page (v2.1) | A gentle, always-available support page with crisis resources; never triggered by reading thought text (section 23) |
| Database | MongoDB remains the chosen database unless the product owner changes it |

“Fixed layout” means stable, automatically assigned world positions. It does not mean a flat or visually rigid environment. The terrain and environmental composition can be organic while saved tree positions remain stable.

### 2.2 Confirmed conceptual direction, with MVP boundaries

The broader concept includes three symbolic forms of care:

- **Water 💧:** empathy, attention, and nurturing.
- **Sunlight ☀️:** joy, affirmation, and positive energy.
- **Wind 🌬️:** challenge, resonance, and ideas that bend or develop.

Watering is an MVP requirement. Sunlight and wind remain part of the product's conceptual model, but their full interactions are not required for the first MVP. Architecture and visual design should not make them impossible to add later.

Time is another influence: trees can develop over time without requiring a background job to run continuously. Growth must never become a guilt mechanic.

### 2.3 Open decisions

These are not confirmed requirements and must not be silently treated as such.

| ID | Open decision | Suggested approach | Needed by |
|---|---|---|---|
| OD-01 | Authentication provider and session mechanism | Select a maintained option compatible with the deployment | Public deployment |
| OD-02 | Final palette (style resolved in v2.0: pixel-art cozy-game, section 18) | Start from the palette in 18.4, then review it visually | Visual refinement |
| OD-03 | Exact seven-stage growth rules and thresholds | Define a transparent deterministic model; do not invent engagement scores | Growth implementation |
| OD-04 | How watering contributes to growth | Use bounded influence and prevent rapid repeated watering from becoming a growth exploit | Care implementation |
| OD-05 | Whether/how sunlight and wind are represented in v1 UI | Keep extension points; do not build full mechanics without approval | Later scope |
| OD-06 | Thought length and validation limits | Set and document server-side limits before implementing APIs | Thought API |
| OD-07 | Deletion behavior | Decide hard delete vs. soft delete, confirmation, and care-history handling | Delete implementation (**resolved 2026-10-12**: permanent, 3.4) |
| OD-08 | Camera control details (style resolved by OD-15: ground-relative 3D) | Prototype the touch gesture map in 17.6 and evaluate on devices | 3D prototype |
| OD-09 | Exact tree geometry and foliage-generation technique | Choose based on visual quality and measured performance | Environment implementation |
| OD-10 | Hosting and production configuration | Choose to fit repository and MongoDB deployment | Deployment |
| OD-11 | Numerical performance budget | Profile a representative scene before setting targets | Optimization |
| OD-12 | Whether more than one personal orchard will ever be supported | Keep the data model extensible, but ship one orchard per user | Future scope |

---

## 3. Product model and thought lifecycle

The core relationship is:

**User → Orchard → Thought → Visual Tree**

A thought is the persistent domain entity. Its tree is the spatial and visual representation of that thought. The renderer reconstructs trees from persisted records; it does not own the authoritative thought data.

### 3.1 Creating a thought

1. The user chooses **Plant Thought**.
2. A lightweight writing surface opens with a text area, Save, and Cancel.
3. The user enters a thought. Title, tags, category, mood, and other metadata are not required.
4. The server validates and persists the thought.
5. A deterministic placement service assigns a stable position without moving existing trees.
6. The orchard displays the new tree.
7. The user receives clear confirmation only after persistence succeeds.

If saving fails, the UI explains the failure and preserves the draft where possible.

### 3.2 Reading and editing

Selecting a tree opens a focused thought detail view. It shows the complete thought, original creation date, last-edited date when applicable, growth stage, available care action, and Edit.

Editing updates `content` and `updatedAt`. It must preserve:
- Thought ID.
- Original `createdAt`.
- Orchard and owner.
- Position and placement seed.
- Care history.
- The tree's stable identity.

Editing must not create a second tree or silently reset growth. The original creation date remains visible.

### 3.3 Deletion

Deletion is required as a data-management capability, but the exact interaction and storage strategy remain open (OD-07). Before implementing it, choose hard deletion or soft deletion and define how care events and references are handled. Require explicit confirmation. No orphaned interactive tree may remain after successful deletion.

### 3.4 Deletion in Milestone 1 (v2.3)

**CONFIRMED (2026-10-12 review):** deletion is part of basic thought management in Milestone 1, alongside create, inspect and edit, with confirmation and correct persistence.

Rules regardless of strategy:
- Delete is offered in tree inspection and in the Notebook.
- A confirmation names what will happen ("Remove this thought and its tree?") and needs a deliberate second tap. It is never one tap.
- After the server confirms, the tree disappears from the world, the Notebook, and the map model. No other tree moves.
- If the request fails, nothing is removed and the user is told.
- Elaborate removal animations and a recovery bin are deferred.

**CONFIRMED (2026-10-12, OD-07 resolved): permanent deletion after a two-step confirmation.**
- The thought and all of its care events are permanently removed. Nothing is kept in a bin.
- Ownership is checked: only the owner's thought in the owner's orchard can be deleted.
- Order of operations: the thought is deleted first, then its care events. If the process stops in between, the leftover care events belong to no thought, are never shown, and are removed by the next delete attempt for that ID.
- Retries are safe: deleting a thought that no longer exists returns `404`, and the client treats that as already deleted. A retry still clears any leftover care events.
- No other tree moves. The freed spot may be used by a future planting.

---

## 4. The seven growth stages

The original concept defines seven visually distinguishable stages:

1. **New Thought** — a newly planted idea; the smallest, most delicate visual presence.
2. **Seedling** — the first visible sprout.
3. **Budding** — a young plant beginning to branch or form buds.
4. **Young Tree** — a clearly established tree with a developing trunk and canopy.
5. **Blossoming** — a tree showing its first meaningful bloom or distinctive seasonal-like detail.
6. **Flourishing** — a fuller, richer tree with abundant foliage and/or blossoms.
7. **Fully Grown** — a mature, stable tree with its own established silhouette.

These are the canonical product-facing stage names. The current three-stage type (`sapling`, `young`, `mature`) is insufficient and must be replaced or mapped explicitly to the seven-stage model. Do not silently collapse the seven stages into three.

### 4.1 Growth principles

- Stage differences must be visible in actual geometry, silhouette, foliage, branching, and/or blossoms, not only in a badge.
- Growth is deterministic from persisted inputs and documented rules.
- Time may contribute to growth; care may influence it according to a transparent, bounded rule.
- Reopening the app must reconstruct the same stage from the same saved state.
- No continuously running server process is required merely to advance age-based growth.
- Trees do not die, wither, or punish the user for absence.
- Growth rules must not become streaks, leaderboards, or a pressure to check in daily.

### 4.2 Growth model

**CONFIRMED (2026-10-12 review):**
- The seven stages (C-04).
- **Growth never reverses.** A tree never shrinks, wilts, regresses, or loses a stage, including when the formula changes later.
- **Time and care are separate inputs.** Time alone grows every tree to Fully Grown; watering contributes on top. Neither is required for the other.
- **Elapsed time, growth progress and care history are kept distinct** (4.3). They are never collapsed into one stored number.
- **Growth is reproducible from saved data alone**, even if the app is not opened for weeks: the same planting time and care history always give the same result for the same moment.
- No streaks, no decay, no penalty for missed days, no scolding for extra watering.

**CONFIRMED (2026-10-12, OD-28 resolved as Option C):** time alone reaches Fully Grown in 60 days. Watering adds bonus growth, capped at one third of total growth, so watering every day reaches Fully Grown in about 40 days.

The calculation, in integer milliseconds so there is no floating-point drift:

```text
DAY_MS            = 86,400,000
timeMs            = max(0, now − createdAt)
countedWaterings  = waterings counted under the window rule below
careRawMs         = countedWaterings × WATER_BONUS_DAYS × DAY_MS
careMs            = min(careRawMs, floor(timeMs / 2))      ← the cap
growthMs          = timeMs + careMs
stage             = highest stage with thresholdDays × DAY_MS ≤ growthMs
progress          = (growthMs − stageStartMs) / (nextStageStartMs − stageStartMs), or 1 at Fully Grown
```

Why `timeMs / 2` is the one-third cap: care ≤ ⅓ × (time + care) is the same as care ≤ ½ × time.

**Counting rule:** consider only `water` events with `thought.createdAt ≤ event.createdAt ≤ now`, sorted by `createdAt` then `_id`. The first counts; each later one counts if it is at least `WATERING_WINDOW_HOURS` after the last *counted* one. Event times are always set by the server.

**Banked care:** waterings beyond the cap are not lost. As time passes, the cap rises and earlier waterings start to count, so a burst of care keeps contributing later. This keeps growth monotonic: `timeMs` only grows and the counted set only grows, so `careMs` and `growthMs` never decrease.

| Constant | Value | Status |
|---|---|---|
| `WATER_BONUS_DAYS` | 1 | **CONFIRMED** (Option C) |
| Care cap | ⅓ of total growth (care ≤ time ÷ 2) | **CONFIRMED** (Option C) |
| Fully Grown threshold | 60 days | **CONFIRMED** |
| Other stage thresholds | 0 · 1 · 3 · 7 · 14 · 30 days | PROPOSED (P-01), tune after visual review |
| `WATERING_WINDOW_HOURS` | 20 | PROPOSED (P-01) |

Worked examples (unit-tested):

| Care pattern | Fully Grown on |
|---|---|
| Never watered | Day 60 |
| Watered every day | Day 40 (care hits the cap; growth runs at 1.5 days per day) |
| Watered every 3 days | Day 45 (care ≈ ⅓ day per day, below the cap) |
| Watered 30 times in the first 30 days, then never | Day 40 (cap releases the banked waterings as time passes) |

Rules that hold:
- Extra watering inside the window is accepted, recorded in history, and gets the full watering response (5.5), but adds no growth.
- Editing a thought never affects growth.
- Days are real elapsed time (UTC milliseconds ÷ 86,400,000), so time zones don't matter.
- Any change to values or formula is versioned (`growthModelVersion`) and must not lower any existing tree's stage.

### 4.3 Three separate things: time, care history, growth

| Concept | What it is | Stored? | Where |
|---|---|---|---|
| Elapsed time | Time since planting, from the immutable `createdAt` and the current time | `createdAt` only | Thought (9.1) |
| Care history | Every watering, with its time and idempotency key, append-only | Yes | CareEvent (9.2) |
| Growth state | Derived: `timeGrowthDays`, `careGrowthDays`, `growthDays`, stage, stage number, progress within the stage (0–1), counted waterings, last watered | **No**: computed on every read | `computeGrowth` (4.4) |

Because growth state is never stored, it cannot drift from the history it is derived from.

### 4.4 Where growth is computed

- `features/growth/growthModel.ts` holds the pure function `computeGrowth(createdAt, careEvents, now, modelVersion)`. It returns every field of the growth state in 4.3, with time and care contributions reported separately.
- The **server** runs it for every API response and sends the result with its own current time.
- The **client** may run the same function to keep trees current during a long session or offline, using cached care events and the server time offset. It never sends a stage to the server.
- Sunlight and wind (5.4) are reserved as typed care inputs with zero weight in Milestone 1, so adding them later changes weights, not structure.

### 4.5 Care history

- Every watering is a `CareEvent` (9.2), append-only, never edited. Deleting a thought deletes its care events with it (3.3).
- Tree inspection shows the planted date, last edited date, last watered date, and an optional list of the dates it was watered.
- No totals, scores, streaks, or "next stage in X days" countdowns are shown.
- Undoing a watering is not available in Milestone 1 (OD-24).

### 4.6 The seven stages: what each looks like

**CONFIRMED:** each stage has a recognisable silhouette and visible differences in the model itself, not just a label (4.1, C-04). **PROPOSED (P-15):** the appearance below. The first five columns are already implemented in the procedural generator (ADR-005); light points and within-stage change are Milestone 1 work.

| Stage | Silhouette | Trunk and branches | Canopy and foliage | Blossoms / fruit | Light points (18.9) |
|---|---|---|---|---|---|
| 1 New Thought | A small dirt mound, ankle height (~0.3 m) | None; a seed showing | A single pixel sprout | — | One faint point at the seed |
| 2 Seedling | A two-leaf sprout, shin height (~0.6 m) | A thin green stem | Two leaves | — | 0–1 |
| 3 Budding | A sapling, waist height (~1.3 m) | Thin stem with 2–3 twigs | Small leaf clusters at twig ends | One bud at the top | 1–2 |
| 4 Young Tree | A slim tree, ~3 m, taller than the viewer | Slender trunk, 2 branches | One rounded canopy with 2–3 lobes | — | 2–4 |
| 5 Blossoming | A full small tree, ~4.5 m | Thicker trunk, 3 branches | Four canopy lobes, fuller | A scattering of blossoms in one colour per tree | 4–8 |
| 6 Flourishing | A wide tree, ~5.5 m | Root flare appears, 4 branches | Six lobes, wide and dense | Many blossoms | 8–14 |
| 7 Fully Grown | A large tree with its own shape (round, tall or spreading, from its seed), 6.5–7.5 m | Strong trunk, roots, 5 branches | Eight lobes, the widest canopy | Blossoms and amber fruit | 12–20 |

Within a stage, as progress goes from 0 to 1:
- The canopy fills out from about 90% to 100% of its size.
- Foliage shifts slightly toward the sunlit end of the tree's leaf colours.
- Light points move from the low to the high end of the stage's range.

Watering adds to the light points within the stage's range (counted waterings raise the point count, capped at the top of the range), so a tended tree glows a little more than an untended one at the same stage. An untended tree still has the stage's minimum, so nothing looks neglected.

Every tree keeps the same seed-based identity (shape, leaf colours, blossom colour) through all seven stages, so it stays recognisably *itself* as it grows.

---

## 5. Care interactions

### 5.1 Watering: MVP requirement

Watering is an intentional act of care, not a generic button press or a score.

When the user waters a selected tree:
1. The interface makes the action discoverable without overwhelming the world.
2. The client sends a care request to the backend.
3. The backend validates ownership and request identity.
4. The care event is persisted once.
5. The client receives the confirmed updated care/growth state.
6. The tree gives immediate, restrained visual feedback.
7. Any growth change follows the documented growth model; watering does not automatically skip stages without an explicit rule.

The interaction should feel connected to the tree. Appropriate feedback might include a brief water animation, particles or droplets, a gentle material/foliage response, or a subtle growth cue. These are design candidates, not a mandate to add every effect.

Requests must be idempotent so retrying the same request does not duplicate the care event. Repeat-watering limits and the exact contribution of watering to growth remain open decisions (OD-04).

### 5.2 Sunlight and wind: broader vision

- **Sunlight** expresses joy and affirmation. Possible later effects include blooms, warm highlights, or changes in foliage.
- **Wind** expresses challenge and resonance. Possible later effects include branch movement or a subtle change in how a tree responds.

These mechanics are not MVP acceptance criteria. Do not add UI controls that appear functional but do nothing. Keep the design modular enough to support them later.

### 5.3 Time and inactivity

Time can influence the tree's development without requiring continuous simulation. The product must never frame inactivity as neglect or make users feel responsible for keeping trees alive.

### 5.4 Meaning of each influence (v2.1)

| Influence | Meaning | Possible visual effect (not final) |
|---|---|---|
| Water 💧 | Empathy: the thought resonated emotionally. Replaces the emotional meaning of a like without a popularity counter. | Healthier, fuller foliage |
| Sunlight ☀️ | Joy, hope, affirmation | Blossoms, warm highlights, a soft glow |
| Wind 🌬️ | Challenge and resonance: the thought prompted reflection, without a reply or argument | Bending branches, deeper roots |
| Time ⏳ | Natural growth: a thought does not need validation to mature | Gradual progression through the seven stages |

**Design notes, not mechanics:** the original concept also explored *silence* and *resonance*. Keep them as design notes. Do not turn them into a fourth care action without a decision.

**Open (OD-24):** whether sunlight and wind ship in the first release; whether each action can be done once per thought or repeatedly; how much each contributes to growth; whether care actions can be undone. In a private orchard the author is the only one who can care for their trees.

### 5.5 Tending a tree: the watering interaction (v2.3)

**CONFIRMED (2026-10-12 review):** care must feel tangible, with a clear visual response tied to the tree's growth state, and must never become a score or popularity mechanic.

**PROPOSED (P-16):** the interaction, step by step.

**Approach.** As you come near a thought-tree (within about 6 m in Immersive, or when the explorer stands beside it), its light points brighten slightly and a small pixel marker shows it can be opened. Tapping it opens the letter panel: the thought, its stage name, and its dates (4.5). The tree stays visible behind the panel.

**Tend.** The panel's **Water** button shows a small watering can. Pressing it:

| Moment | What you see | What is saved |
|---|---|---|
| Press | The watering can tips; pixel droplets start falling on the canopy and at the roots. The button shows it is working | A care request is sent with a new idempotency key |
| Server confirms, watering counted | Droplets finish; leaves brighten one shade for about 2 seconds; one new light point fades in, if the stage's range allows; the canopy fills out slightly if progress moved it | One `CareEvent`. Growth state is recomputed (4.3) |
| Server confirms, stage changed | After the droplets, the tree grows to its next stage in a few stepped frames (about 0.6 s); the panel's stage name updates | Same single `CareEvent` |
| Server confirms, inside the 20-hour window | Droplets and the leaf brightening play in full; no new light point, no size change; no message about limits | One `CareEvent`, not counted toward growth |
| Request fails | Droplets stop and fade; the panel says the watering couldn't be saved, with **Try again** | Nothing. Retrying with the same key can't create a duplicate |
| Offline (Milestone 2 outbox) | Droplets play; the panel says it will be saved when back online | Queued with its key (17.5) |

**Notice.** The panel's "Last watered" date updates. The change in the tree stays: more light, slightly fuller canopy, or a new stage. It is visible the next time you walk past.

Rules:
- Feedback that implies a saved change (new light point, growth, new stage) appears only after the server confirms (5.1).
- No numbers, counts, "+1", progress bars, or percentages anywhere.
- Under reduced motion, droplets become a short static splash and the stage change is instant.
- In the Notebook, Water does the same thing, and the change shows on the tree when you next see it.
- Sunlight and wind will follow the same approach → tend → notice pattern with their own visuals (5.4).

---

## 6. 3D world and world-building requirements

### 6.1 The world is the product

The orchard is not a background behind a dashboard. It is the primary place where the user experiences the product. Environmental design, scale, navigation, tree selection, and care should reinforce the same idea: thoughts have a place and can be revisited.

### 6.2 Procedural environment

Build the environment from code-generated geometry, materials, and controlled procedural variation. Do not use static landscape images, pasted tree images, or a pre-rendered scene as a substitute for the interactive world.

The environment should include, where appropriate:
- Ground with believable scale and restrained natural variation.
- Tree trunks, branches, foliage, and root flares or visible roots.
- Grass and low vegetation distributed in coherent clusters.
- Paths and clearings that create a legible spatial composition.
- Lighting, shadows, and atmospheric depth that establish scale.
- Natural transitions between dense and open areas.

Every element must have a visual or navigational reason to exist. Remove accidental-looking floating squares, disconnected slabs, placeholder triangles, and scatter that reads as noise. Do not add environmental detail merely to make the scene busier.

### 6.3 Tree individuality

Trees must not look like one repeated object with only its scale changed. Use a small, coherent procedural family with controlled variation in:
- Height and trunk thickness.
- Branch structure.
- Canopy silhouette and density.
- Foliage distribution and restrained color variation.
- Growth-stage appearance.

Use deterministic seeds so a tree retains its visual identity across reloads. Reuse geometry, materials, and instancing where appropriate to keep the scene performant.

### 6.4 World scale and camera

> **v2.1:** This section describes the **Immersive** view. The overhead **Explorer** view and the Map are defined in section 20. Both views show the same world at the same scale; only the camera changes.

In the Immersive view the camera must feel situated within the orchard, not looking down on a miniature model.

Requirements:
- Establish consistent world units and document reference dimensions.
- At the default exploration viewpoint, mature trees must be visibly taller than the camera viewpoint. Do not solve scale problems by making every tree enormous.
- Use a deliberate default camera position, field of view, and near/far clipping range.
- Provide predictable orbit/exploration, pan or traversal, and zoom within sensible limits.
- Prevent zoom levels that make the orchard microscopic or cause a canopy to fill the entire view without context.
- Selecting a tree should frame it usefully while preserving the sense of inhabiting the environment.
- Provide a reliable return-to-overview action.
- Preserve the user's camera position when opening and closing a thought detail view where practical.
- Camera gestures must not accidentally trigger tree selection.
- Support reduced-motion preferences and provide non-3D access to all thought content.

The exact control scheme is open (OD-08), but the immersive scale requirement is confirmed.

### 6.5 Fixed spatial layout

Tree placement is automatic, persistent, and stable:
- New trees receive a position that respects existing positions and minimum spacing.
- Adding a thought must never relocate existing trees.
- Reloading must reconstruct the same tree positions.
- Placement must be deterministic or persist its assigned coordinates.
- Placement must avoid severe overlap while maintaining an organic distribution.
- The implementation must support incremental additions without regenerating the entire orchard.

A collision-aware or Poisson-disc-style approach is acceptable, but the chosen algorithm must be documented and tested. Terrain can be organic; logical tree positions remain fixed.

### 6.6 Visual quality gate

A scene is not accepted merely because it contains trees and renders successfully. Review it at ground-relative, mid-range, and overview distances. Check:
- Tree-to-camera proportions.
- Coherent terrain and path composition.
- Natural distribution and silhouette variation.
- Legibility of the seven growth stages.
- Selection and care feedback.
- Lighting and shadows that support rather than obscure navigation.
- Performance and absence of obvious placeholder artifacts.

The first implementation should prioritize believable proportions and composition over environmental complexity.

---

## 7. UX and accessibility

### 7.1 Orchard view

The orchard is the default working environment after entry. It should prioritize the 3D world, with restrained controls for navigation, Index/list access, and Plant Thought.

The interface must not dominate the environment. Use contextual details and panels rather than a persistent dashboard full of cards.

### 7.2 Thought detail

Show:
- Complete thought text.
- Original creation date.
- Last-edited date, if applicable.
- Current growth stage.
- Watering action.
- Edit action.
- Return-to-orchard action.

Keep the selected tree visible when practical.

### 7.3 Accessible index

Provide a keyboard-accessible list or equivalent alternative to selecting trees in 3D. Users must be able to read, edit, and care for a thought without depending exclusively on mouse gestures or WebGL.

Include accessible labels, visible focus, readable text, clear loading/error states, and reduced-motion support. Provide a usable fallback if WebGL is unavailable. Provide the plain-font readability setting described in 18.7.

---

## 8. Architecture

### 8.1 Recommended stack

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| 3D | Three.js + React Three Fiber |
| 3D helpers | Drei where useful |
| API | Next.js Route Handlers |
| Database | MongoDB |
| Data access | Mongoose or official MongoDB driver |
| Validation | Zod or equivalent |
| Unit/integration tests | Vitest or equivalent |
| End-to-end tests | Playwright or equivalent |
| Mobile shell | Capacitor (proposed, OD-13; section 17.2) |

Use the existing repository's conventions where sensible. Do not introduce a separate Express backend unless the repository has a real need for it.

### 8.2 Boundaries

- **UI:** forms, panels, navigation, accessible index, presentation state.
- **Rendering:** scene, camera, geometry, materials, selection, visual animation.
- **Domain:** thought lifecycle, placement, care rules, growth calculation.
- **API:** request parsing, validation, authentication, authorization, error handling.
- **Persistence:** database connection, repositories, indexes, data serialization.

The renderer must not query MongoDB directly. The client must not invent authoritative care or growth values.

### 8.3 Original system model reconciliation

The original Day 1 model named `Forest`, `Camera`, `InteractionController`, `Region`, `Tree`, `Thought`, `TreeVisual`, `GrowthStage`, `TimeOfDay`, and `TimeEngine`.

Treat these as conceptual responsibilities, not a requirement to create a class for every diagram box:
- `Forest` / orchard scene: world composition and loaded tree collection.
- `Camera`: camera configuration and navigation.
- `InteractionController`: selection, hit testing, and care interaction routing.
- `Region`: optional spatial partitioning, introduced only when needed for placement or rendering scale.
- `Thought`: persistent domain record.
- `Tree` / logical tree: stable thought identity, position, and derived growth.
- `TreeVisual`: 3D representation reconstructed from domain data.
- `GrowthStage`: the seven-stage domain/visual mapping.
- `TimeOfDay` / `TimeEngine`: future environment-time system; not required for MVP unless time-of-day becomes an explicit visual feature.

Prefer small composable modules over a rigid object-oriented simulation. Keep the original system diagrams updated to match the actual implementation and record architectural decisions when responsibilities change.

### 8.4 Suggested project organization

```text
src/
├── app/
│   ├── page.tsx
│   ├── orchard/page.tsx
│   └── api/
│       └── thoughts/
│           ├── route.ts
│           └── [id]/
│               ├── route.ts
│               └── care/route.ts
├── components/
│   ├── ui/
│   └── thoughts/
├── rendering/
│   ├── OrchardCanvas.tsx
│   ├── scene/
│   ├── environment/
│   ├── trees/
│   ├── camera/
│   └── interaction/
├── features/
│   ├── thoughts/
│   ├── placement/
│   └── care/
├── server/
│   ├── db/
│   ├── repositories/
│   ├── services/
│   ├── validation/
│   └── auth/
├── lib/
├── types/
└── tests/
```

Adapt directories to the actual repository. The required separation of responsibilities matters more than exact filenames.

---

## 9. Database model

MongoDB is authoritative for thought content, assigned positions, and care history.

### 9.1 Thought

```ts
type GrowthStage =
  | "new-thought"
  | "seedling"
  | "budding"
  | "young-tree"
  | "blossoming"
  | "flourishing"
  | "fully-grown";

type Thought = {
  _id: string;
  orchardId: string;
  userId: string;
  content: string;
  position: { x: number; z: number };
  regionId: string;          // v2.2: region the tree stands in (20.7); fixed at planting
  placementSeed?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};
```

The growth stage is derived from persisted creation/care inputs by `computeGrowth` (4.3, 4.4). No stage is stored.

### 9.2 Care event

```ts
type CareEvent = {
  _id: string;
  thoughtId: string;
  orchardId: string;
  userId: string;
  type: "water";             // "sunlight" | "wind" are reserved for later (5.4)
  createdAt: Date;
  idempotencyKey: string;
};
```

Store care events separately to preserve history and support idempotent processing. Care events are append-only. Whether a watering "counted" toward growth is derived (4.2), not stored.

### 9.3 Orchard

```ts
type Orchard = {
  _id: string;
  ownerId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  placementVersion: number;    // world layout + placement rules version (ADR-003)
  growthModelVersion: number;  // growth formula version (4.2)
};
```

Version 1 supports one personal orchard per user. The schema may remain extensible for future needs. Regions are defined by the world layout in code (20.7), versioned by `placementVersion`; they are not separate database documents in Milestone 1.

### 9.4 Integrity

- Every thought belongs to one orchard and one owner.
- Positions are persistent.
- IDs and creation timestamps remain stable through edits.
- Care events reference valid thoughts and the correct owner/orchard.
- Store timestamps consistently in UTC.
- Queries enforce ownership and orchard boundaries.
- Deletion and care operations must not leave inconsistent references.
- Add indexes for orchard/creation time, owner/orchard, care events by thought/time, and a unique idempotency key scoped to the owner/request context.

---

## 10. API specification

Use JSON and consistent error responses. Authentication and authorization are mandatory before public deployment. A local development identity may be used during development, but production must never trust a user ID supplied by the browser.

### `POST /api/thoughts`
Accepts `{ "content": "...", "idempotencyKey": "..." }`. Validate content, resolve the current user and orchard, assign a stable collision-aware position, persist, and return the saved thought with its position. Return `201 Created`. A repeated request with the same idempotency key returns the original thought instead of planting a second tree (needed for the mobile outbox, 17.5).

### `GET /api/thoughts`
Returns the current user's orchard thoughts, including stable IDs, content, timestamps, positions, and data needed to reconstruct appearance. Add pagination or spatial chunking when justified by scale.

### `GET /api/thoughts/:id`
Returns a thought only when it belongs to the current user and orchard.

### `PATCH /api/thoughts/:id`
Accepts `{ "content": "..." }`. Updates content and `updatedAt`; preserves ID, `createdAt`, position, owner, orchard, and care history. Reject client attempts to overwrite system-managed fields.

### `POST /api/thoughts/:id/care`
Accepts `{ "type": "water", "idempotencyKey": "..." }`. Verifies ownership, validates the action, processes the key idempotently, persists the care event, and returns confirmed care/growth information:

```json
{
  "event": { "_id": "...", "type": "water", "createdAt": "..." },
  "counted": true,
  "growth": { "stage": "budding", "stageNumber": 3, "progress": 0.4, "lastWateredAt": "..." },
  "stageChanged": false,
  "serverNow": "..."
}
```

A retried request with the same key returns the original response and creates nothing. More than 50 waterings of one thought in 24 hours returns `429` (abuse limit, not a game rule).

Every thought returned by the other endpoints includes the same `growth` object and its `careHistory` dates.

### `DELETE /api/thoughts/:id`
Implement only after OD-07 is resolved. Verify ownership and apply the agreed deletion strategy.

**v2.3:** in Milestone 1 scope (3.4). Permanent. Returns `204` on success. Deleting an already-deleted, missing, or someone else's thought returns `404` (the client treats `404` after a retry as done). Care events are removed after the thought, as described in 3.4.

### Errors

Use appropriate HTTP statuses: `400` invalid input, `401` unauthenticated, `403` forbidden where disclosure is appropriate, `404` missing/inaccessible resource, `409` conflict, `429` rate limited, and `500` unexpected failure. Do not expose stack traces, secrets, or private records.

---

## 11. Security, privacy, and resilience

- Thoughts are private by default.
- Enforce ownership for read, edit, care, and delete operations.
- Validate all inputs on the server.
- Keep database credentials in environment variables and out of source control.
- Use secure sessions when authentication is enabled.
- Apply request-size limits and documented content validation.
- Prevent duplicate care events on retries.
- Avoid logging full private thought text unless essential for a specific, justified debugging case.
- Confirm database writes before showing a successful save.
- Preserve drafts where possible when a save fails.
- Public deployment requires a defined authentication mechanism and secure session configuration.

---

## 12. Non-functional requirements

**Persistence:** Thoughts, positions, and care history survive reloads and restarts.

**Spatial stability:** Existing trees do not move when another thought is created.

**Responsiveness:** Routine UI interactions remain responsive during rendering and scene updates.

**Accessibility:** Core reading and editing tasks do not depend solely on 3D navigation.

**Resilience:** Failed saves produce a clear error and preserve draft content where possible.

**Maintainability:** Placement, growth, care, persistence, and rendering are independently testable.

**Portability:** Deployment uses environment configuration, not hardcoded local paths or credentials.

**Observability:** Failures are diagnosable without unnecessarily logging private thought content.

**Performance:** Reuse geometry and materials, instance repeated objects where appropriate, limit unnecessary animation, dispose of unused resources, and avoid rebuilding the entire world after a single thought update. Set numerical budgets after profiling on an iPhone and a mid-range Android phone (17.7).

**Offline tolerance:** Drafts and queued writes survive network loss and app restarts (17.5).

---

## 13. Testing strategy

### Unit tests
- Input validation.
- Deterministic placement and minimum spacing.
- Existing-position stability when adding thoughts.
- Seven-stage growth calculation.
- Care-event idempotency.
- Editing preserves identity, creation time, position, and care history.
- Ownership and authorization checks.

### Integration tests
- Database connection and persistence.
- Create/read/edit lifecycle.
- Edit does not move a tree.
- Care event is persisted and returned consistently.
- Invalid input and unauthorized access are handled correctly.
- Concurrent thought creation does not create conflicting positions or inconsistent records.

### End-to-end tests
1. Open the orchard.
2. Plant a thought.
3. See its tree appear.
4. Select and read the thought.
5. Edit it.
6. Reload.
7. Confirm content, identity, creation date, and position persist.
8. Water the tree and see feedback.
9. Reopen it and confirm care state persists.

### Rendering tests
- Scene initializes without fatal errors.
- Trees can be selected reliably.
- Camera navigation does not cause accidental selection.
- Camera scale feels ground-relative at the default view.
- The seven stages are visually distinguishable.
- Tree placement avoids severe overlap.
- Care feedback is visible and restrained.
- Resources are disposed appropriately.
- A usable fallback exists when WebGL is unavailable.

### Mobile and pixel-art tests
- A drag of more than the tap threshold never selects a tree.
- Pinch zoom stays within the camera limits.
- The scene renders at the intended low internal resolution with hard pixel edges (no smoothing).
- UI pixel art scales by whole numbers only.
- Drafts survive an app kill; a retried plant or water request creates exactly one record.
- The Android back button closes the topmost panel first.

---

## 14. MVP acceptance criteria

The MVP is complete only when all applicable criteria pass.

### Thought management
- [ ] Create and persist a thought.
- [ ] Read a saved thought.
- [ ] Edit it without changing its ID, creation timestamp, position, or care history.
- [ ] Preserve a draft after a failed save where possible.

### Orchard world
- [ ] Code-generated interactive 3D environment; no static landscape image as a substitute.
- [ ] Coherent ground, tree geometry, foliage, and supporting environment.
- [ ] Tree-to-camera proportions make the default view feel immersed rather than miniature.
- [ ] Every saved thought has a corresponding tree.
- [ ] Trees are automatically placed and remain fixed after reload and new additions.
- [ ] Trees have controlled, deterministic visual variation.
- [ ] Camera navigation, tree selection, and return-to-overview work reliably.
- [ ] Placeholder geometry and accidental-looking scatter are absent from the reviewed scene.

### Growth and care
- [ ] Seven canonical growth stages exist in the domain model and visual design.
- [ ] Stages have visible differences in tree appearance.
- [ ] A user can water a tree.
- [ ] Care events persist and duplicate retries do not create duplicate events.
- [ ] Tree appearance reflects the documented growth model.
- [ ] Inactivity never kills or punishes a tree.

### Mobile app and pixel-art look
- [ ] The app installs and runs on iOS and Android devices.
- [ ] All core actions work with touch alone, with primary controls in thumb reach.
- [ ] The world renders as pixel art (low internal resolution, hard edges, stepped shading, limited palette).
- [ ] UI uses the pixel-art kit (panels, icons, font) and offers the plain-font readability setting.
- [ ] Drafts and queued writes survive network loss and app restarts.
- [ ] In-app account deletion exists before store submission.

### Quality and privacy
- [ ] Core interactions also work in supported desktop browsers.
- [ ] Accessible alternative to 3D-only selection exists.
- [ ] Unauthorized users cannot access private thoughts.
- [ ] Automated tests cover core domain logic and API behavior.
- [ ] Errors, loading, and WebGL fallback states are handled.

---

## 15. Implementation roadmap

> **v2.0:** This is the original roadmap. Section 19.3 is the current roadmap; it revises Phase 1 into Phase 1R and adds Phases 2M and 5. Where they differ, 19.3 wins.

### Phase 1 — World and camera foundation
- Audit the current scene and component architecture.
- Define world units and reference proportions.
- Build a coherent procedural ground, tree family, vegetation distribution, and paths.
- Establish the ground-relative camera, navigation limits, selection, and overview reset.
- Use seeded sample data and demonstrate all seven growth stages visually.

**Exit criterion:** A cohesive, navigable 3D orchard with believable proportions and selectable trees. The scene is reviewed at exploration, inspection, and overview distances.

### Phase 2 — Persistent thought lifecycle
- Configure MongoDB.
- Implement thought/orchard schemas and repository.
- Implement create, list, retrieve, and edit endpoints.
- Implement deterministic placement that never relocates existing trees.
- Connect the creation, detail, edit, and accessible index views.

**Exit criterion:** Thoughts survive reloads with identity, creation timestamp, and position intact.

### Phase 3 — Care and growth
- Implement care event persistence and idempotency.
- Finalize and document growth thresholds and care contribution.
- Implement watering feedback and stage-specific visual changes.
- Add unit and integration tests.

**Exit criterion:** Watering and growth behave consistently and persist across reloads.

### Phase 4 — Accessibility, reliability, and deployment
- Implement authentication and authorization.
- Complete accessible thought selection and keyboard behavior.
- Add error/loading states and WebGL fallback.
- Run automated tests and rendering/performance profiling.
- Configure deployment and documentation.

**Exit criterion:** The application meets MVP acceptance criteria without exposing private data.

### Future exploration
- Sunlight and wind interactions.
- More expressive tree growth and environment-time behavior.
- Multiple personal orchards.
- Search or spatial navigation for large collections.
- Carefully considered sharing, only if it remains consistent with the original philosophy.

Future scope must not silently delay the first complete working orchard.

---

## 16. Repository and agent working rules

- Keep `docs/spec.md` as the source of truth for product requirements.
- Maintain a changelog and architecture decision record.
- Agents must inspect the current repository and tests before modifying code.
- Agents must distinguish confirmed requirements, open decisions, implemented behavior, and proposed changes.
- Do not silently rewrite the product vision or turn an open decision into a requirement.
- Update documentation when architecture or behavior changes.
- A feature is done only when behavior matches the spec, required state persists, errors are handled, tests pass, and private data remains protected.

---

## 17. Mobile app

### 17.1 Decision

**Confirmed by the product owner (2026-10-12):** Thought Orchard ships as an installable mobile app for iOS and Android. This replaces "Primary platform: Web". Everything in sections 1–16 still applies unless this section says otherwise; in particular the 3D procedural world, privacy, persistence, fixed placement, and the seven growth stages are unchanged.

The web build stays as a development target and secondary client. It is not a separate product.

### 17.2 Approach: wrap the existing app with Capacitor (proposed — OD-13)

| Option | What it means | Verdict |
|---|---|---|
| **Capacitor shell around the React/R3F client** | The same React + React Three Fiber code runs in a native WebView, packaged as an iOS/Android app, with native plugins for storage, haptics, keyboard, and app lifecycle | **Recommended.** Reuses all of Phase 1. WebGL in modern iOS/Android WebViews is good enough for a deliberately low-resolution pixel renderer (section 18). |
| React Native + Expo with `@react-three/fiber/native` | Rewrite the UI in React Native; 3D via expo-gl | Rejected for v1: rewrites every UI component, and Drei/postprocessing support on native is partial. Revisit only if WebView performance fails the budget. |
| PWA only | Installable web app, no store listing | Not sufficient: the product owner wants a mobile app. Can still be offered for free alongside. |

### 17.3 Architecture changes

The mobile app cannot run server code. Next.js Route Handlers and MongoDB access must live in a deployed server, and the app talks to it over HTTPS.

```text
iOS / Android app (Capacitor)
  └── WebView: static export of the React + R3F client
        ├── UI layer (pixel-art HUD, panels, Index)
        ├── Rendering layer (low-res pixel renderer)
        └── API client ──HTTPS──> Deployed Next.js server
                                    ├── /api/thoughts ... (unchanged contract, section 10)
                                    ├── auth, validation, ownership
                                    └── MongoDB
```

Requirements:
- **Two build targets from one repository.** A server build (web pages + Route Handlers) deploys to hosting. A client-only static export (`output: "export"`) is what Capacitor packages. Client code must not import from `server/`.
- **API base URL from configuration**, never hardcoded. Relative `/api/...` calls only work on the web build.
- **CORS** on the API must allow the Capacitor origins (`capacitor://localhost` on iOS, `https://localhost` on Android) and nothing broader than needed.
- **The renderer and UI still never talk to MongoDB.** The boundaries in section 8.2 are unchanged; the API boundary simply becomes a network boundary.

### 17.4 Authentication on mobile

OD-01 (auth provider) remains open, but whatever is chosen must work in a native shell:
- Prefer **token-based sessions** (short-lived access token + refresh token) over cross-origin cookies, which are unreliable inside WebViews.
- Store tokens only in the platform keychain/keystore through a secure-storage plugin. Never in `localStorage`.
- If any third-party social login is offered on iOS, **Sign in with Apple** must also be offered (App Store rule).
- Apps that let users create accounts must let them **delete their account in-app** (App Store rule). This makes OD-07 (deletion behaviour) a blocker for store submission, and it must cover deleting all thoughts and care events.

### 17.5 Offline and unreliable networks

Phones lose signal. The spec already requires that a failed save keeps the draft; on mobile this becomes:
- **Drafts persist on the device** (not just in component state) until the server confirms the save, surviving app kills and restarts.
- **Outbox for writes.** Plant, edit, and water requests that fail for network reasons are queued and retried. Each queued request carries an idempotency key.
- **`POST /api/thoughts` gains an `idempotencyKey`**, matching care events, so a retried plant never creates two trees. (API change to section 10.)
- **Placement stays server-authoritative.** A queued thought shows as a pending seed marker in the UI, not as a placed tree, until the server assigns its position. The client must never pick a permanent position itself.
- A cached copy of the last loaded orchard may be shown read-only while offline, clearly marked as offline.

### 17.6 Touch interaction

| Gesture | Action |
|---|---|
| One-finger drag | Pan / walk across the orchard |
| Two-finger pinch | Zoom within the limits of section 6.4 |
| Two-finger twist or drag | Rotate the view (if OD-15 keeps rotation) |
| Tap | Select a tree. A touch counts as a tap only if it moves less than ~8 px and lasts under ~250 ms, so panning never selects a tree by accident. |
| Tap empty ground | Close the detail panel, keep the camera where it is |

Additional requirements:
- Every control is at least **44×44 pt**. Tree hit areas stay generous (the current invisible cylinder approach is fine).
- **Primary actions sit at the bottom** within thumb reach (Plant, Index, Recenter), Stardew-mobile style, not in a top bar.
- Respect **safe areas** (`viewport-fit=cover` + `env(safe-area-inset-*)`) for notches and home indicators.
- The writing sheet must stay visible above the **software keyboard**.
- The **Android back button** closes the topmost panel first, then returns to the overview; it never exits the app with unsaved draft text.
- **Haptics**: one light tap when watering is confirmed. No other haptics by default. Off when the OS asks for reduced haptics.
- Hover-only feedback (the current hover ring and pointer cursor) does nothing on touch; selection feedback must not depend on it.

### 17.7 Mobile performance and battery

- Render the 3D scene at **low internal resolution** (section 18.3). This is the single biggest mobile win: a 320×180–480×270 render target costs a fraction of a full-resolution retina frame.
- Replace 2048² shadow maps with **cheap blob or pixel shadows** under trees.
- Use R3F `frameloop="demand"` or a frame cap when nothing is animating, and **pause rendering when the app is backgrounded**.
- Keep sway and mote animation subtle and disable it under reduced motion.
- The numerical budget (OD-11) must now be measured on a **mid-range Android phone** as well as an iPhone, not only desktop.

### 17.8 Orientation

Portrait-first is proposed, because writing thoughts is the main input task and portrait suits one-handed writing. Landscape is supported for exploring. Final choice is OD-14.

### 17.9 Store and privacy obligations

- App Store privacy labels and Google Play Data Safety forms must declare: user content (thoughts) collected, linked to the user, not used for tracking, not shared.
- No analytics or advertising SDKs that read thought content. Any crash reporting must strip thought text.
- A privacy policy URL is required by both stores before submission.

---

## 18. Pixel-art visual direction

### 18.1 Decision

**Confirmed by the product owner (2026-10-12):** the look and feel of the UI and UX is pixel-art, in the cozy farming-game style of *Stardew Valley* and *Harvest Town*. This resolves the style half of OD-02. The 3D world stays procedural and code-generated (section 6.2); pixel art is how it is **drawn**, not a switch to 2D sprite sheets.

"8-bit feel" means: chunky visible pixels, a limited palette, hard edges with no anti-aliasing, and simple stepped shading. The reference games are actually 16-bit-era in palette richness, so the palette may be warmer and larger than a strict 8-bit console palette.

### 18.2 Why keep 3D instead of switching to 2D tiles

A 2D tilemap would be the most literal Stardew copy, but it would contradict confirmed requirements: the immersive, ground-relative camera (6.4), procedural 3D geometry (6.2), and visibly different 3D silhouettes per growth stage (4.1). Rendering the 3D world through a pixel-art pipeline keeps those requirements and still reads as a pixel game. Games such as *A Short Hike* are the reference for this "pixelated 3D" technique.

**Confirmed by the product owner (2026-10-12, OD-15):** the world stays 3D, rendered through the pixel-art pipeline below. A 2D tile world is out of scope. **Updated in v2.1:** an overhead camera on the same 3D world *is* in scope, as the Explorer view (section 20); it sits alongside the ground-relative Immersive view, it does not replace it.

### 18.3 Rendering pipeline for pixelated 3D

1. **Render at low resolution.** Draw the scene at about 240 render pixels on the screen's shorter side (OD-18) and upscale it with **nearest-neighbour filtering** at a whole-number scale. Implemented by lowering the WebGL drawing-buffer size and upscaling with CSS `image-rendering: pixelated` (ADR-002).
2. **No anti-aliasing**, no smooth tone-mapping blur. Hard pixel edges are the point.
3. **Stepped (toon) lighting.** Use `MeshToonMaterial` or a custom shader with a 2–4 step gradient map (`NearestFilter`) instead of smooth `MeshStandardMaterial` shading.
4. **Palette quantization.** A post-process pass snaps every pixel to the project palette (section 18.4). This keeps the world, UI, and icons in one consistent colour family.
5. **Outlines (optional).** A one-pixel dark outline from depth/normal edges helps trees read as sprites. Prototype and judge visually.
6. **Stable pixels.** Moving cameras make pixel art shimmer ("pixel crawl"). Snap camera movement to whole render-target pixels where possible and keep camera motion slow and damped.
7. **Pixel-friendly geometry.** Low-poly trunks and foliage clusters with deliberate, chunky silhouettes. Detail smaller than one render pixel is wasted and adds noise.
8. **Fog becomes banded.** Atmospheric depth uses a few discrete colour bands rather than smooth exponential fog.

### 18.4 Palette

A starting palette, to be refined visually (still part of OD-02):

| Role | Colours (starting point) |
|---|---|
| Grass and foliage | 4–5 greens from deep forest to sunlit lime |
| Earth and paths | warm browns and tan dirt |
| Wood and UI panels | honey, chestnut, dark walnut (for borders) |
| Parchment / text panels | cream, light tan |
| Water and care feedback | 2–3 clear blues |
| Blossoms (stages 5–6) | soft pink, peach, white |
| Accents | warm amber for selection and sunlight, never neon |

Target: roughly 24–32 colours in total. UI text on panels must still meet WCAG contrast (4.5:1 for body text).

### 18.5 Growth stages in pixel art

Pixel art suits the seven stages well because each stage can have a clearly different silhouette:

| Stage | Pixel-art read |
|---|---|
| 1 New Thought | A small dirt mound with a visible seed or a single pixel sprout |
| 2 Seedling | Two-leaf sprout |
| 3 Budding | Short stem with small branches and buds |
| 4 Young Tree | Thin trunk, one rounded canopy cluster |
| 5 Blossoming | Fuller canopy with a few blossom pixels |
| 6 Flourishing | Wide canopy, many blossoms or fruit, root flare |
| 7 Fully Grown | Large, distinctive silhouette unique to the tree's seed |

Each stage is still generated from code with a deterministic per-tree seed (6.3). Trees never wilt.

### 18.6 Pixel-art UI

The interface stays restrained (7.1) but adopts the cozy-game vocabulary:

| Original (v1) component | Pixel-art version |
|---|---|
| `OrchardHeader` (top pill bar) | Small wooden sign top-left with the orchard name and tree count; **bottom toolbar** with pixel icons for Plant (seed packet), Index (journal), Recenter (compass) |
| `ThoughtDetailModal` | Parchment letter / dialogue box anchored at the bottom with a wooden border, like reading a letter in Stardew. Shows the stage name and a small pixel icon of the stage. |
| `PlantThoughtModal` | A journal page that slides up over the keyboard; "Plant" button styled as a seed packet |
| `AccessibleThoughtList` | A journal book: one row per thought with stage icon, first line, and planted date |
| Watering | Watering-can button; pixel droplet particles on the tree; a short sparkle. **No numbers, scores, or "+1" popups** — care is not a stat |
| Loading | Small pixel sprout growing frame by frame (static under reduced motion) |

UI building blocks:
- **Pixel borders** for wood and parchment panels with notched corners (implemented with side-only CSS box-shadows, no image assets).
- **Pixel icons defined in code** as small pixel grids rendered to SVG `<rect>`s or canvas. This keeps the "generated in code" principle and lets icons use the exact palette. `lucide-react` icons are replaced.
- **Integer scaling.** UI pixels scale by whole numbers (2×, 3×, 4×) so borders and icons never blur.
- **Buttons** press down by one pixel on tap; no smooth shadows or glassy blur (`backdrop-blur` goes).
- **Motion** is stepped, a few frames, not smooth easing. Typewriter text reveal in the dialogue box is allowed, but tapping shows the full text immediately, and it is off under reduced motion.

### 18.7 Typography and readability

- **Pixel font for UI labels and headings** (an open-licence font such as Pixelify Sans or Silkscreen, bundled with the app, not fetched at runtime so it works offline).
- **Thought text must stay comfortable to read and write.** Long-form text uses a readable pixel font at a generous size, or a plain font inside the pixel panel.
- **Readability setting:** a toggle to switch all text to a plain system font. Pixel fonts are hard for some people with dyslexia or low vision. This is an accessibility requirement, not an optional extra.
- Respect the OS text-size setting, scaling in whole-pixel steps.

### 18.8 Sound (optional, OD-16)

Soft chiptune sound effects (watering, planting, page turn) fit the style. If added, sound is **off by default** or very quiet, has its own mute toggle, and there is no background music in v1 unless approved.

### 18.9 Mood from the reference paintings (v2.1)

**Confirmed by the product owner (2026-10-12):** keep the pixel renderer, and carry the mood of the painted references through it. The references are painterly; we do not copy their rendering, we copy their atmosphere.

| Reference quality | Pixel-art translation |
|---|---|
| Warm, low golden light through a canopy | Warm amber key light, cooler green-blue fill; light shafts as a few bright pixel bands, not volumetric blur |
| Mist and depth | Banded fog in sage and pale gold, denser toward the forest edge |
| Fireflies and floating motes | One-pixel amber motes that drift and pulse in stepped frames; more at dusk and night |
| Thought-trees glowing with points of light | Planted trees carry small warm light points in the canopy, scaled with growth stage: none or one for a New Thought, many for Fully Grown. This marks thought-trees apart from ordinary forest trees |
| Dense forest framing open clearings and winding dirt paths | Taller, denser forest edge; ground cover bushes along paths; clearings around thought-trees |
| Cracked, sunlit dirt paths | Two or three dirt tones painted into the path tiles, lighter where light falls |
| Wildflowers in pink, white, violet | Sparse flower pixels in clusters, as now |

Rules:
- Glow must stay calm. No bloom flare, lens dirt, or motion blur (the "Sprint" reference blur is not carried over).
- Night and dusk must keep thought text and UI fully readable; the UI panels do not dim with the world.
- Reduced motion: motes and fireflies hold still or pulse very slowly; no flicker.
- The mood palette extends 18.4 with: firefly amber, pale gold mist, dusk violet, night blue. Final values remain part of OD-02.

---

## 19. Repository status and revised roadmap

### 19.1 Current implementation (updated 2026-10-12, after Phase 1R work)

> **Superseded:** the current status after the Milestone 1 build is in section 26. This table is kept as the Phase 1R record.

All work is uncommitted. TypeScript, ESLint, and 12 unit tests pass. See `CHANGELOG.md` and `docs/decisions.md` for details.

| Area | Status |
|---|---|
| Pixel renderer: low-res buffer, nearest upscale, toon shading, palette, blob shadows | Implemented (ADR-002) |
| Palette quantization pass, pixel outlines, camera pixel snapping (18.3 steps 4–6) | **Not started**; add if visual review needs them |
| Seven-stage procedural trees with per-tree variation | Implemented (ADR-005) |
| Ground with painted paths, forest edge, clustered grass and flowers | Implemented |
| Ground-relative touch camera, tap-vs-drag threshold, Overview action | Implemented; not yet tested on a physical phone |
| Placement keeping trees off paths | Implemented and unit-tested (ADR-004) |
| Pixel UI kit, HUD, bottom toolbar, letter panel, journal, plant sheet, readability setting | Implemented |
| Sample data covering all seven stages | Implemented, in-memory only |
| Backend, MongoDB, API, validation, auth | **Not started** (Phase 2) |
| Edit thought, watering, care events | **Not started** (Phases 2–3) |
| Unit tests (Vitest) | Started: placement, trees, icons, pixel ratio |
| End-to-end tests (Playwright) | **Not started** |
| Architecture decision record | `docs/decisions.md` |
| Mobile shell (Capacitor) | **Not started** (Phase 2M) |

### 19.2 Gaps against this spec

1. ~~**Two spec files.**~~ Resolved in v2.0.
2. **Growth model.** Seven stages now exist, but sample data still sets `growthState` directly. Section 4 requires the stage to be derived from persisted inputs once OD-03 is decided.
3. ~~**Camera scale.**~~ Resolved in Phase 1R: default eye height 2.2 m on the entry path; young trees and older stand above eye level (19.5).
4. ~~**Placeholder geometry.**~~ Resolved: path slabs replaced by paths painted into the terrain.
5. **Planting reports success with no persistence.** The sheet closes immediately and IDs come from `Date.now()`. Acceptable for the prototype; must change in Phase 2.
6. ~~**`(0, 0)` treated as no position.**~~ Fixed and covered by a test.
7. ~~**Leftover starter CSS.**~~ Removed.
8. ~~**Mobile-hostile defaults.**~~ Mostly resolved: bottom toolbar, touch gestures, no shadow maps, low-res rendering, hover only on mouse. Still to do: on-device testing and the Android back button (needs Capacitor).
9. **Focus trapping.** Journal and plant sheet move focus in and restore it on close, but do not yet trap Tab inside the dialog.

### 19.3 Revised roadmap

> **v2.2:** Superseded for planning by the milestones in section 25. Kept for history; Phase 1R is done as described, and Phase 1V below is replaced by Milestone 1 (25.1).

Phases 2–4 from section 15 still apply. Mobile and pixel art slot in as follows:

**Phase 1R — Pixel world and touch foundation** (revises Phase 1)
- Low-res render target, toon lighting, palette quantization, banded fog.
- Seven-stage pixel-readable tree family with deterministic per-tree variation.
- Camera decision (OD-15) and touch gestures with the tap-vs-drag threshold.
- Pixel UI kit: palette tokens, 9-slice panels, code-defined pixel icons, bundled pixel font, readability toggle.
- Bottom toolbar and dialogue-box detail panel; works in a phone-sized browser viewport.

*Exit:* the prototype looks and feels like a pixel-art cozy game on a phone-sized screen, with seven visible stages and reliable tap selection.

**Phase 1V — Views and mood** (added in v2.1; see sections 18.9, 20, 22, 23)
- Mood pass: golden key light, banded gold-sage mist, fireflies, glowing thought-tree canopies, denser forest edge and path-side bushes.
- Explorer view with a pixel explorer character (Walk only), view switching that keeps your place, trunk collision.
- Notebook with search (rename Journal), Settings screen, support page.

*Exit:* both views work on a phone-sized screen and match the reference mood at the reviewed distances.

**Phase 2 — Persistence** (as section 15, plus)
- Idempotency key on `POST /api/thoughts`.
- Configurable API base URL; no client imports from server code.

**Phase 2M — Mobile shell**
- Capacitor project, static-export build target, iOS and Android builds running on real devices against a deployed dev API.
- Secure storage, keyboard, haptics, app-lifecycle, and back-button handling.
- On-device draft persistence and outbox.

*Exit:* the app installs on an iPhone and an Android phone, plants and reloads thoughts against the real API, and survives being killed mid-draft.

**Phase 3 — Care and growth** (as section 15, with the pixel watering feedback from 18.6)

**Phase 4 — Reliability** (as section 15, plus)
- Token-based auth suited to mobile, in-app account deletion, profiling on a mid-range Android phone.

**Phase 5 — Store release**
- App icons, splash screen, store screenshots, privacy policy, privacy labels and Data Safety form, TestFlight and Play internal testing, then submission.

### 19.4 New open decisions

| ID | Open decision | Suggested approach | Needed by |
|---|---|---|---|
| OD-13 | Mobile technology | Capacitor wrapping the existing React/R3F client (17.2) | Phase 2M |
| OD-14 | Orientation | Portrait-first, landscape supported | Phase 1R |
| OD-15 | ~~Camera style under pixel art~~ | **Resolved 2026-10-12:** keep 3D with the ground-relative perspective camera, rendered as pixel art | — |
| OD-16 | Sound | Optional soft chiptune effects, off by default | Phase 4 |
| OD-17 | ~~Canonical spec file~~ | **Resolved 2026-10-12:** this file is `docs/spec.md` (v2.0); v1.0 archived | — |
| OD-18 | Internal render resolution and pixel scale | Implemented at ~240 px on the short side; tune on real devices | Phase 1R |
| OD-19 | Region names and count, and whether a user ever chooses a region (the region *system* is confirmed, C-21) | See 20.7 | Milestone 2 |
| OD-20 | Movement controls beyond P-03/P-04; Wander / Sprint details | See 20.2–20.6 | Milestone 1 (Walk), 2 (others) |
| OD-21 | Map travel: tap-to-travel, teleport, fast travel, minimap, region previews | Map shows and focuses; travel by walking or a single "go to" glide | Map build |
| OD-22 | Time of day: real clock, accelerated in-world time, or user-chosen; seasons; weather | See 21 | Milestone 2 |
| OD-23 | Thought metadata: titles, categories, emotional tags, character limits | None required (spec 3.1); optional additions need a decision | Thought API |
| OD-24 | Sunlight and wind rules, undoing care (watering rules are proposed in 4.2) | See 5.4 | Milestone 2 |
| OD-25 | Backpack: what it holds | Leave out until it has a purpose; do not ship an empty control | Interface build |
| OD-26 | Support page content and localisation | **Resolved 2026-10-12:** India first, by configuration (23) | — |
| OD-27 | Explorer character design | Small pixel-art figure, neutral, no customisation in v1 | Explorer view build |
| OD-28 | ~~How strongly watering speeds up growth~~ | **Resolved 2026-10-12:** Option C (C-31) | — |

OD-02 (art direction) is now partially resolved: the style is pixel-art cozy-game with the reference mood (18.9); the final palette remains open.

### 19.5 World units and reference dimensions (Phase 1R)

> **v2.2:** These are the values the Phase 1R prototype uses. The proposed values for both views are in 20.1–20.3 and replace these once approved.

Required by 6.4. One world unit is one metre.

| Reference | Value |
|---|---|
| Default camera eye height | 2.2 m, standing on the entry path about 20 m from the orchard centre |
| Camera height limits | 1.2 m to 18 m above ground |
| Camera distance limits | 4 m to 30 m from the look-at target |
| Field of view | 50° vertical |
| Tree height by stage | 1 New Thought 0.3 m · 2 Seedling 0.6 m · 3 Budding 1.3 m · 4 Young Tree 3 m · 5 Blossoming 4.5 m · 6 Flourishing 5.5 m · 7 Fully Grown 6.5–7.5 m |
| Minimum tree spacing | 4.8 m |

Stages 4–7 are taller than the default eye height, which is what makes the default view feel inside the orchard rather than above it.

---

## 20. Views, scale, movement, map and regions

Status labels used below: **CONFIRMED** (decided by the product owner; date or source given), **PROPOSED** (a recommendation awaiting approval; see section 27), **OPEN** (unresolved), **DEFERRED** (intended behaviour recorded, built later).

### 20.1 World units and scale

- **CONFIRMED (v1.1, 6.4):** trees must tower over a person standing among them; the world must feel larger than any one tree.
- **CONFIRMED (2026-10-12 review):** the explorer-to-tree scale must hold in both views.
- **CONFIRMED (2026-10-12 review):** the numbers in 20.1–20.3 are **initial implementation parameters**, not proof of the right feeling. Both views are accepted only after the product owner reviews them in the running build against the references (20.9). Passing collision or scale tests is necessary but not sufficient.
- **PROPOSED (P-02)** values. One world unit is one metre.

| Reference | Value |
|---|---|
| Explorer character height | 1.6 m |
| Immersive eye height | 1.6 m above the terrain (the prototype uses 2.2 m; this lowers it) |
| Tree heights by stage | 0.3 · 0.6 · 1.3 · 3 · 4.5 · 5.5 · 6.5–7.5 m (stages 1–7, already implemented) |
| Person : Fully Grown tree | about 1 : 4.5 |
| Forest edge trees | 8–12 m, always taller than the tallest thought-tree so the forest frames the orchard |
| Minimum spacing between thought-trees | 4.8 m |

From stage 4 (Young Tree, 3 m) upward, every thought-tree is taller than the viewer in the Immersive view.

### 20.2 Immersive view

**CONFIRMED (2026-10-12):** first-person, eye level, no avatar, the feeling of standing inside a forest with trees towering around you.

**PROPOSED (P-03)** rules:

| Rule | Value |
|---|---|
| Camera | Perspective, 55° vertical field of view, near plane 0.1 m |
| Position | Eye at 1.6 m above the terrain under it; follows terrain smoothly |
| Looking | Turn freely left and right; look from 35° down to 60° up, so you can look up into a canopy |
| Walking speed | 1.4 m/s (Walk) |
| Touch | Drag to look around. Tap the ground to walk there. Tap a tree to open it (see below) |
| Mouse and keyboard | W/A/S/D or arrow keys to walk, drag to look, click the ground to walk there, click a tree to open it |
| Tapping a tree | Within 12 m: turn to face it and open the thought. Further away: walk to 3 m from the trunk, face it, then open it |
| Leaving | The forest edge is a boundary; you slide along it |
| Return | "Back to the path" returns you to the orchard entrance, facing in |

This **replaces the orbit-style camera** in the current prototype (19.1). Orbiting around a point reads as looking at a model, not standing in a forest.

### 20.3 Explorer view

**CONFIRMED (2026-10-12):** an overhead view with a visible third-person explorer character, from which the world's layout is readable.

**PROPOSED (P-04)** rules:

| Rule | Value |
|---|---|
| Camera | Perspective with a narrow 35° field of view, so the layout reads almost like a map while keeping 3D depth |
| Angle | Looking down at 55° (adjustable 45°–65°) |
| Distance | 18–40 m from the explorer (pinch or wheel to zoom) |
| Height rule | The camera always stays at least 4 m above the tallest tree near it, so no tree reaches the camera |
| Following | The camera follows the explorer smoothly; turning the view rotates around the explorer |
| Explorer | A 1.6 m pixel-art character, built in code like the trees (OD-27) |
| Walking | Same speed and modes as the Immersive view |
| Touch | Tap the ground to walk there. Pinch to zoom. Two-finger twist to turn the view. One-finger drag looks around and springs back to the explorer when they move |
| Mouse and keyboard | W/A/S/D or arrows move the explorer, click to walk, wheel to zoom, right-drag to turn |
| Tapping a tree | The explorer walks to 2.5 m from the trunk, faces it, and the thought opens |
| Occlusion | A canopy between the camera and the explorer dissolves into a pixel dither pattern so the explorer is never hidden |

### 20.4 Switching between views

- **CONFIRMED (2026-10-12):** the user can switch at any time.
- **PROPOSED (P-05):** one shared position, the explorer pose `{ x, z, heading }`, drives both views. In Immersive the camera sits at the pose's eye height facing its heading; in Explorer the character stands at the pose. Switching changes only the camera, never the world.
- An open thought stays open across a switch.
- The switch is a short stepped camera move, instant under reduced motion.
- The switch is one labelled toolbar control, reachable by keyboard.

### 20.5 Map: in the architecture now, map screen later

- **CONFIRMED (2026-10-12 review):** the map and region system are part of the world architecture from the start. The polished map screen comes in Milestone 2. The map must always reflect the actual world.
- **PROPOSED (P-06):** a pure function `buildMapModel(worldLayout, thoughts, explorerPose)` returns paths, region areas, tree markers (ID, position, stage) and the explorer marker.
  - Milestone 1 implements and tests this function (every marker equals a stored tree position; every region area matches the world layout) but builds no map screen.
  - Milestone 2 draws the parchment map from this model.
  - The map never stores positions of its own.
- **DEFERRED:** the parchment map screen, tap-a-marker-to-travel, region signposts (reference 10). Minimap, teleport and fast travel are OD-21.

### 20.6 Movement modes

From the original notes: `WANDER`, `WALK`, `SPRINT`, and a transition between them. They apply to both views.

| Mode | Intended behaviour | Milestone |
|---|---|---|
| Walk | Default controlled movement, 1.4 m/s | **1** |
| Wander | Hands-free slow stroll along the paths at about 0.7 m/s; any input stops it | DEFERRED (2) |
| Sprint | Faster movement for crossing a large orchard, about 3.5 m/s | DEFERRED (2) |
| Transition | Speed changes ease over about 0.3 s in stepped frames, never a jerk | With Wander/Sprint |

There is no motion blur and no head bob. Under reduced motion, speed changes are instant. Exact controls are OD-20.

### 20.7 Regions: in the architecture now

- **CONFIRMED (2026-10-12 review):** the region system exists in the world architecture from the beginning, and tree positions stay stable.
- **PROPOSED (P-07)** structure:
  - The world layout (`features/world/worldLayout.ts`, ADR-003) defines regions as data: ID, optional display name, area, and the paths that connect them.
  - Every thought stores the `regionId` of the region its position falls in, fixed at planting (9.1).
  - Milestone 1 layout: one active region, the central grove around the current clearing. Further region areas are reserved around it as terrain, connected by paths, but not used for planting.
  - Placement fills the active region. When it is full, the next reserved region opens, in a fixed order. This is the "automatic regions" option and is the interim rule until OD-19 is decided.
- **CONFIRMED (2026-10-12 review):** automatic filling must respect region boundaries and the intended landscape. Trees are never placed "wherever there is space".
- **PROPOSED (P-17):** landscape-aware placement.
  - Each region in the world layout defines **planting sites**: groves and clearings along its paths, each with a centre, a radius and a capacity. Open ground, path corridors, and the gaps between groves are not planting sites.
  - A new tree goes into the next site with room, in the region's fixed site order, so thought-trees gather in clusters along winding paths (references 03, 09, 10), with open space between clusters.
  - Inside a site, the existing seeded collision-aware placement (ADR-004) picks the exact spot, kept inside the site's boundary, away from paths, and at minimum spacing.
  - A candidate outside the region's boundary is always rejected.
  - Tests check: every tree lies inside its region and a planting site; none on a path; spacing holds; existing trees never move; the same inputs give the same positions.
- **CONFIRMED (C-21, restated):** the future map is drawn from this same world model (layout, regions, sites, paths, stored positions). It never generates its own approximation.
  - Opening a region or naming one later never moves a tree. Layout changes bump `placementVersion`; existing trees keep their stored position and `regionId`.
- **OPEN (OD-19):** final region names and count, and whether the user ever chooses a region at planting. Historical names from the references: Quiet Woods, Central Grove, Work Forest, Warm Meadow, Clarity Hills.

### 20.8 Collision and terrain

- **CONFIRMED (2026-10-12 review):** neither view clips through trunks or terrain.
- **PROPOSED (P-08)** method:
  - **Trunk colliders:** every tree has a circular collider of trunk radius + 0.35 m. Movement slides along colliders instead of stopping dead.
  - **Boundary:** the forest edge is a soft wall you slide along.
  - **Terrain:** the Immersive eye and the explorer's feet always follow the terrain height under them. Terrain stays gentle by design, so there are no cliffs to fall from.
  - **Camera clearance:** the Immersive camera never comes within 0.35 m of a trunk. The Explorer camera stays above canopies (20.3).
- **Test:** an automated test walks scripted routes into trunks and the boundary and checks the minimum clearance is never broken.

### 20.9 Visual review in the running build

**CONFIRMED (2026-10-12 review):** the spec does not replace looking at the forest. Milestone 1 is not done until the product owner has walked the running build.

The review session, on desktop and on a phone-sized screen:
1. Enter the orchard. Does it feel like standing inside a forest, with depth, foreground foliage, winding paths and distant clusters?
2. Walk around in the Immersive view. Do trees tower? Does movement feel calm and natural?
3. Switch to the Explorer view. Is the orchard's geography readable? Does the explorer look small next to a grown tree?
4. Approach a tree, open it, read it.
5. Plant a new thought and watch its tree appear in a sensible place.
6. Water a tree. Is the response clear and tangible without feeling like a score?
7. Switch views back and forth; reload; come back later (or with the clock moved forward in a test build). Is everything where it was, and have trees grown as the model says?
8. Compare stills from each view with references 01, 03, 05, 09 and 10 for mood, depth and scale.

Findings are recorded in the journal and become tuning changes to the proposed values (P-01 to P-04, P-15 to P-17).

---

## 21. Time and atmosphere: DEFERRED, intended behaviour kept

From the original `TimeOfDay` / `TimeEngine` concept.

- **CONFIRMED (v1.1):** world time is separate from growth time. Time of day changes light and mood only; growth uses persisted timestamps and care (4.2).
- **Intended behaviour (DEFERRED to Milestone 2):** morning, afternoon, evening (dusk) and night, each changing light colour and direction, sky, fog colour and firefly density. Thought-trees glow more visibly at dusk and night (18.9). It is computed on the device; there is no server process.
- **Milestone 1:** one fixed time, late-afternoon golden light, matching the references. **Foundation now:** lighting, sky, fog and firefly density are driven by a single `timeOfDay` parameter (fixed in Milestone 1), so adding time of day later changes the input, not the scene code.
- **OPEN (OD-22):** real clock, accelerated in-world time, or user-chosen; seasons; weather.
- Wind as an environment animation (sway) is separate from Wind as a care action (5.4).

---

## 22. Interface inventory

**Milestone 1 builds only the interface the core loop needs.** Everything else is deferred.

### 22.1 Milestone 1 interface

| Element | Purpose |
|---|---|
| Entrance | Title, one-line welcome, **Enter the orchard** (exists) |
| Toolbar | Plant · Notebook · View switch · Back to the path (Overview) |
| Plant sheet | Write and save a thought; keeps the draft on failure (exists, needs saving to the API) |
| Tree inspection | Read the thought; see stage, planted, edited and watered dates; **Water** (5.5); **Edit**; **Delete** with confirmation (3.4). The letter panel exists; these actions are new |
| Notebook | The existing Journal list renamed: every thought with stage and date; open, edit, water and delete from the list (the accessible alternative, 7.3) |
| Readability toggle | Plain-font setting (exists) |
| States | Loading, saving, saved, error, offline, and empty orchard ("Plant your first thought") |

### 22.2 DEFERRED interface

| Element | Notes | Milestone |
|---|---|---|
| Map screen | Draws `buildMapModel` (20.5) | 2 |
| Settings screen | Gathers readability, reduced motion, sound, account and support | 2 |
| Notebook search | Search thoughts by text | 2 |
| "View map" on the entrance | Arrives with the map screen | 2 |
| Log in / Sign up | With authentication (OD-01) | Before deployment |
| Backpack | No defined purpose (OD-25); not built until it has one | — |
| Sound | OD-16 | — |

### 22.3 Tree inspection

Read the full thought, see its stage and care history (4.5), edit it, water it, and return to exactly where you were. The thought appears in a pixel letter panel near the tree (references 06, 10), never covering the controls needed to leave.

---

## 23. Support page

- **CONFIRMED (2026-10-12):** the first public release includes a gentle support page.
- **PROPOSED (P-09):** build it at the end of Milestone 1 as a small static page reached from the toolbar's overflow or the Notebook, because Milestone 1 has no Settings screen. In Milestone 2 it moves into Settings.
- It is **never triggered automatically** by reading or analysing thought text.
- Tone, from reference 12: "If this thought feels heavy to hold alone, support exists. You don't have to use these; they're just here."
- **OD-26 (resolved below):** the resources. Numbers in the references (988, Crisis Text Line) are US-only. The page must show correct resources per country, or a reputable international directory, verified before release.
- **CONFIRMED (2026-10-12 review):** resources must be appropriate to the user's country, and the page must stay accessible without inferring the user's mental state from their thoughts.
- **PROPOSED (P-18):**
  - Choose the country from the device's language and region setting, not from location tracking. Let the user change it on the page.
  - Show only resources verified for that country. For a country without verified entries, show a reputable international helpline directory and local emergency-number guidance instead of guessing.
  - Copy US numbers from the references only for the US entry, and only after verification.
  - Each entry is reviewed and dated in the bundled content before each release.
- **CONFIRMED (2026-10-12, OD-26 resolved):** **India** is the initial target country.
  - Resources live in a configuration file keyed by country code, each entry with its source and the date it was verified. Adding a country means adding verified entries, not changing code.
  - The country comes from the device's language and region setting (for example `en-IN`), never from precise location. The user can change it on the page.
  - When a country has no verified entries, the page shows a reliable international helpline directory instead.
  - The app never infers mental state from thought content and never tracks location to choose resources.
- It works offline (bundled content), works in plain-font mode, and is not tracked.

---

## 24. Development journal and design history

- **CONFIRMED (2026-10-12 review):** preserve the original Day 1 journal, the UML diagrams and the design references. Historical decisions are never rewritten as if newly made.
- `docs/journal/`: chronological entries in the author's voice, starting with Day 1. The original UML diagrams (class, sequence, state) go in `docs/journal/diagrams/`. Updated diagrams are added beside the originals, never over them.
- `docs/references/`: design reference images, in dated folders, with an index. The 2026-10-12 set (13 images) is preserved there.
- `docs/archive/`: superseded specs (v1.0 is there). v1.1's text survives inside this file, with sections 1–16 largely unchanged.
- **Provenance rule:** each confirmed requirement in section 27 states where it came from: the original concept, v1.0, v1.1, or a dated product-owner decision. A new decision that changes an older one says so explicitly and keeps the old one visible.
- Agents may add short, clearly marked factual journal entries, but never edit past entries or invent history.
- **Still missing:** the Day 1 entry and the original UML diagrams. They have to come from the author; nothing has been reconstructed.

---

## 25. Milestones

### 25.1 Milestone 1: foundation (not the complete product)

**CONFIRMED (2026-10-12 review):** Milestone 1 is a foundation. It proves the complete core loop, including watering and persistence, in a coherent world, before secondary interface is added. Deferred features keep their data and architectural foundations now.

**The core loop:** enter the orchard → move through it in either view → plant a thought → see its tree appear in a sensible, stable place → approach and inspect it → edit it → water it and see it respond → delete a thought you no longer want → reload and find everything unchanged → come back later and find trees grown as the model says.

**PROPOSED (P-10)** scope, in build order:

1. **World foundation**
   - Regions and planting sites in the world layout (20.7); `regionId` on thoughts; landscape-aware placement (P-17) with tests.
   - `buildMapModel` from the same world data, with tests (20.5).
   - Trunk colliders.
   - A focused mood pass: golden light, banded mist, fireflies, light points in thought-tree canopies (18.9). Lighting driven by a fixed `timeOfDay` parameter (21).
2. **Views and movement**
   - First-person Immersive view replacing the orbit camera; Explorer view with a code-built explorer character; one shared pose and view switching; Walk only; collision and terrain following (20.1–20.4, 20.8).
3. **Persistence**
   - MongoDB, schemas and repositories, Zod validation, a single development identity (no public deployment).
   - Create (idempotent), list, get, edit, delete endpoints; server-side placement with region (9, 10).
4. **Thought management**
   - Plant (saves through the API, keeps drafts on failure), inspect, edit, delete with confirmation (3.4).
   - The Notebook as the accessible path to every action.
5. **Watering and growth**
   - `computeGrowth` with time and care kept separate (4.2–4.4), tested.
   - Idempotent care endpoint; the full watering interaction (5.5); within-stage fullness and light points (4.6); stage-change animation; care history dates (4.5).
   - Sunlight and wind reserved as care types with zero weight (4.4).
6. **Accessibility baseline:** focus trapping in dialogs, keyboard access to every action, reduced motion throughout.
7. **Support page:** minimal static version with verified, country-appropriate resources (23).
8. **Tests and docs:** unit tests (growth, placement, regions and sites, map model, collision), API integration tests against a test database, one end-to-end test of the whole core loop, ADRs, changelog, factual journal entries.
9. **Visual review** in the running build with the product owner (20.9), then tuning.

**Not in Milestone 1 (foundations kept):** map screen (map model exists) · Wander and Sprint (movement modes are a parameter) · sunlight and wind (care types reserved) · time of day (`timeOfDay` parameter exists) · Settings screen · Notebook search · Backpack · sound · authentication provider and public deployment (API is mobile-ready, 17.3) · Capacitor app shell.

**Exit criteria:**
- Every step of the core loop works on a phone-sized browser and on desktop.
- Reloading changes nothing; a test clock moved forward shows growth exactly as the model says.
- Nothing clips; all automated tests pass.
- **The product owner has completed the visual review (20.9) and accepted both views.**

### 25.2 Milestone 2 and later (DEFERRED)

| Area | Milestone 2 | Later / vision |
|---|---|---|
| Map | Parchment map screen from `buildMapModel`, region signposts | Minimap, fast travel (OD-21) |
| Regions | Names and rules once OD-19 is decided | — |
| Movement | Wander, Sprint, transitions | — |
| Care | Sunlight, Wind (5.4, OD-24) | Silence and resonance stay design notes |
| Time | Time of day (21) | Seasons, weather (OD-22) |
| Interface | Settings screen, Notebook search, "View map" on the entrance | Backpack (OD-25), sound (OD-16) |
| Platform | Capacitor iOS/Android shell, offline outbox (17), authentication, deployment | Store release |
| Data | — | Multiple orchards (OD-12) |

### 25.3 Excluded (conflicts with the original philosophy)

Not deferred: **excluded** unless the product owner explicitly reverses the philosophy. Public feeds, likes and engagement counters, followers, rankings, trending, streaks, engagement notifications, replies and debates, social discovery, anonymous sharing, encounters with other people's thoughts, AI categorisation, multiplayer, and any reading of thought text to infer mood or mental state.

---

## 26. Audit checklist

Status of each area against this spec and the code, updated 2026-10-12 after the Milestone 1 build. "Built" means implemented and tested; it does **not** mean accepted. Acceptance needs the visual review (20.9).

| # | Area | Spec | Implementation |
|---|---|---|---|
| 1 | Procedural forest geometry, variation, believable scale | 6, 18, 20.1 | **Built:** seven-stage procedural trees with seeded variation; 1.6 m eye height; forest edge 8–12 m. Awaiting visual review |
| 2 | Terrain, connected paths, vegetation, depth | 6.2, 18.9 | **Built:** terrain, polyline paths painted into the ground, path-side bushes, clustered grass and flowers, forest around open regions, banded sky, mist, fireflies, canopy light points. Awaiting visual review |
| 3 | Map and regions in the architecture | 20.5, 20.7 | **Built (foundation):** regions, planting sites, `regionId`, landscape-aware placement, `buildMapModel`, all tested. Map screen deferred to Milestone 2 |
| 4 | Views, movement, collision | 20.1–20.4, 20.8 | **Built:** first-person Immersive view, Explorer view with a code-built character, shared pose, stepped view switching, Walk, tap-to-walk, WASD, trunk and boundary collision with sliding, terrain following. Wander and Sprint deferred |
| 5 | Create, inspect, edit, delete, persist, return | 3, 10, 22.3 | **Built:** plant, read, edit and permanent delete through the API; reload restores everything (end-to-end tested) |
| 6 | Seven stages and visual changes | 4.1, 4.6, 18.5 | **Built:** stage models, within-stage fullness, light points by stage and care, stepped grow animation |
| 7 | Watering (later sun, wind, time) | 4.2–4.5, 5.4, 5.5 | **Built:** Option C growth model, idempotent care endpoint, droplets, leaf brightening, care history dates. Sunlight and wind reserved with zero weight |
| 8 | Time of day | 21 | **Deferred** by design; `timeOfDay` parameter drives lighting |
| 9 | Interface for the core loop | 22.1 | **Built:** entrance, toolbar (Notebook, Plant, View, Path, More), letter panel, Notebook, plant sheet, loading, error and empty states |
| 10 | Accessibility | 7.3, 17.6, 18.7 | **Built:** Notebook reaches every action; focus trapping; Escape layering; keyboard walking; reduced motion; plain-font setting |
| 11 | Privacy and support | 1.3, 11, 23, 25.3 | **Built:** private per user; support page with India resources, directory fallback; no tracking or content analysis |
| 12 | Database authority, stable placement, idempotency, tests | 6.5, 9, 10, 13 | **Built:** MongoDB, ownership checks, idempotent create and water, placement lock, 50 unit and integration tests, 2 end-to-end tests |
| 13 | Journal, UML, references, decision history | 24 | **Partly in place:** references preserved, ADR-001 to ADR-010, changelog, a factual journal entry. The author's Day 1 entry and UML diagrams still to be added |

**Not done in Milestone 1 (by design):** map screen, Wander and Sprint, sunlight and wind, time of day, Settings screen, Notebook search, Backpack, sound, authentication and deployment, the Capacitor app shell.

---

## 27. Decision register

Every decision in one place, in five separate lists. Nothing appears in more than one list. A proposed value becomes confirmed only when the product owner says so.

### 27.1 CONFIRMED requirements

Decided. Build to these.

| ID | Requirement | Source |
|---|---|---|
| C-01 | Personal, private orchard; one per user | v1.0 |
| C-02 | Each thought is a persistent tree: stable ID, creation time preserved on edit, automatic and stable position | v1.0 |
| C-03 | Procedurally generated 3D world from code; no static images in its place | v1.0 |
| C-04 | Seven growth stages with recognisable, visibly different appearances: New Thought, Seedling, Budding, Young Tree, Blossoming, Flourishing, Fully Grown | Original concept, restored in v1.1 |
| C-05 | Watering is the first care action; idempotent | v1.0, v1.1 |
| C-06 | Water, sunlight and wind as symbolic care; time as natural growth | Original concept (v1.1) |
| C-07 | Inactivity never kills, withers or punishes a tree | v1.0 |
| C-08 | No feeds, likes, counters, followers, streaks or rankings | Original philosophy (v1.0) |
| C-09 | Database is authoritative; MongoDB | v1.0 |
| C-10 | Accessible non-3D way to reach every thought and action | v1.0 |
| C-11 | Edit thoughts | v1.0 |
| C-12 | Mobile app for iOS and Android; web retained | 2026-10-12 |
| C-13 | Pixel-art look in world and UI | 2026-10-12 |
| C-14 | The world stays 3D (no 2D tile world) | 2026-10-12 |
| C-15 | Pixel art carries the reference paintings' mood | 2026-10-12 |
| C-16 | Two views: Immersive (first-person, eye level, no avatar) and Explorer (overhead, third-person explorer) | 2026-10-12 |
| C-17 | Support page in the first public release; private scope kept | 2026-10-12 |
| C-18 | Both views have defined perspective, scale and movement rules; neither clips through trunks or terrain | 2026-10-12 review |
| C-19 | Watering and the seven stages are core; growth rules, persistence, care history and visual changes are specified | 2026-10-12 review |
| C-20 | Sunlight, wind and time of day may come later; their intended behaviour stays in the spec and their foundations exist now | 2026-10-12 review |
| C-21 | Regions, paths, stable positions and region membership are in the world model from the start; the map is derived from that same world data | 2026-10-12 review |
| C-22 | Milestone 1 is a foundation milestone that proves the complete core loop, including watering and persistence | 2026-10-12 review |
| C-23 | Preserve the Day 1 journal, UML diagrams and design references; never rewrite history | 2026-10-12 review |
| C-24 | Growth never reverses, including across formula changes | 2026-10-12 review |
| C-25 | Time growth and watering growth are separate inputs; elapsed time, care history and growth state are kept distinct; growth is reproducible from saved data | 2026-10-12 review |
| C-26 | Automatic placement respects region boundaries and the intended landscape | 2026-10-12 review |
| C-27 | Proposed camera and scale numbers are initial parameters; both views are accepted only after a visual review in the running build | 2026-10-12 review |
| C-28 | Care is tangible (clear visual response tied to growth state) and never a score or popularity mechanic | 2026-10-12 review |
| C-29 | Deletion is in Milestone 1, with confirmation and correct persistence | 2026-10-12 review |
| C-30 | Support resources are country-appropriate; the app never infers mental state from thoughts | 2026-10-12 review |
| C-31 | Growth Option C: time alone reaches Fully Grown in 60 days; 1 bonus day per counted watering; care capped at one third of total growth; daily watering ≈ 40 days; exact integer-millisecond calculation (4.2) | 2026-10-12 (OD-28) |
| C-32 | Permanent deletion after a two-step confirmation; care events deleted with the thought; ownership-checked; retry-safe; no other tree moves (3.4) | 2026-10-12 (OD-07) |
| C-34 | Real accounts: email and password with Better Auth on MongoDB; server-side sessions; one private orchard per account; onboarding; account deletion (28.2, ADR-011) | 2026-10-12 (completion request) |
| C-35 | Separate pages: landing, register, sign in, password reset, onboarding, orchard, Notebook, Map, Settings, support (28.1). Map, Settings and Notebook search brought forward from Milestone 2 | 2026-10-12 (completion request) |
| C-33 | India is the initial support country; resources by configuration with source and verification date; international directory fallback; country from device settings only (23) | 2026-10-12 (OD-26) |

### 27.2 PROPOSED values and designs

Starting points for Milestone 1. Each can be tuned after the visual review without changing confirmed requirements.

| ID | Proposal | Section |
|---|---|---|
| P-01 | Intermediate stage thresholds 0 · 1 · 3 · 7 · 14 · 30 days and the 20-hour watering window (the 60-day total, bonus and cap are confirmed in C-31) | 4.2 |
| P-02 | Scale: 1.6 m explorer and eye height; 8–12 m forest edge | 20.1 |
| P-03 | Immersive: 55° view, look 35° down to 60° up, 1.4 m/s, drag to look, tap to walk, WASD | 20.2 |
| P-04 | Explorer: 35° view, 55° down, 18–40 m, ≥ 4 m above nearby trees, tap to walk, canopy dither | 20.3 |
| P-05 | One shared explorer pose drives both views | 20.4 |
| P-06 | `buildMapModel` pure function in Milestone 1, no map screen | 20.5 |
| P-07 | Regions as layout data; `regionId` on thoughts; one active region, next opens in order (interim) | 20.7 |
| P-08 | Trunk colliders with sliding, soft boundary, terrain following | 20.8 |
| P-09 | Minimal static support page at the end of Milestone 1 | 23 |
| P-10 | Milestone 1 scope and build order | 25.1 |
| P-11 | Capacitor as the mobile shell | 17.2 |
| P-12 | Portrait-first | 17.8 |
| P-13 | Render at ~240 px on the short side | 18.3 |
| P-15 | Seven-stage appearance table and within-stage changes | 4.6 |
| P-16 | Watering interaction: approach → tend → notice, step by step | 5.5 |
| P-17 | Landscape-aware placement: planting sites (groves along paths) filled in order | 20.7 |

### 27.3 UNRESOLVED questions

Need an answer from the product owner. None of these block Milestone 1.

| ID | Question | Options |
|---|---|---|
| OD-01 | ~~Authentication provider and sessions~~ Resolved: Better Auth (C-34). Still open: social sign-in, and token sessions for the mobile app | Needed before deployment |
| OD-02 | Final palette | After visual review |
| OD-06 | Thought length limit | Suggested default: 2,000 characters |
| OD-10 | Hosting | Needed before deployment |
| OD-11 | Performance budget on real devices | After profiling |
| OD-12 | Ever more than one orchard per user | Future |
| OD-16 | Sound | Future |
| OD-19 | Region names, count, and whether users ever choose a region | Before Milestone 2 map |
| OD-20 | Movement details beyond P-03/P-04; Wander and Sprint | Milestone 2 |
| OD-21 | Minimap, teleport, fast travel | Milestone 2 |
| OD-22 | Time-of-day model, seasons, weather | Milestone 2 |
| OD-23 | Thought titles, categories, tags | Future |
| OD-24 | Sunlight and wind rules; undoing care | Milestone 2 |
| OD-25 | Backpack purpose | Future |
| OD-27 | Explorer character design | During Milestone 1 build, reviewed visually |

### 27.4 DEFERRED features

Intended behaviour is recorded; foundations are built in Milestone 1 where noted.

| Feature | Intended behaviour | Foundation in Milestone 1 |
|---|---|---|
| ~~Map screen~~ **Built in v2.5** (28.1) | 20.5 | `buildMapModel` |
| Named regions, signposts | 20.7 | Regions and sites in the layout |
| Wander, Sprint | 20.6 | Movement speed as a mode parameter |
| Sunlight, wind care | 5.4 | Reserved care types, zero weight |
| Time of day | 21 | `timeOfDay` lighting parameter |
| ~~Settings screen, Notebook search, "View map"~~ **Built in v2.5** (28.1) | 22.2 | — |
| Capacitor shell, offline outbox, deployment (authentication **built in v2.5**, 28.2) | 17 | Mobile-ready API (17.3) |
| Store release | 19.3 | — |

### 27.5 RESOLVED questions

| ID | Question | Resolution |
|---|---|---|
| OD-07 | Deletion strategy | Permanent after two-step confirmation (C-32) |
| OD-01 | Authentication for the web app | Better Auth, email and password (C-34, ADR-011) |
| OD-15 | Camera style under pixel art | 3D kept; two views (C-14, C-16) |
| OD-17 | Canonical spec file | docs/spec.md |
| OD-26 | Support page country | India first, by configuration (C-33) |
| OD-28 | Watering strength | Option C (C-31) |

### 27.6 EXCLUDED

See 25.3. These are not deferred; they conflict with the original philosophy.

---

## 28. Complete application: accounts, pages and status (v2.5)

**CONFIRMED (2026-10-12, product owner):** the product scope now includes real accounts and the full set of separate pages, built on the Milestone 1 orchard. This brings forward items sections 22.2 and 25.2 had deferred: the Map screen, the Settings screen, Notebook search, and authentication. The reasons: accounts are needed before anyone else can use the app, and the product owner asked for each page to exist as its own route.

### 28.1 Pages

| Page | Route | Access | Status |
|---|---|---|---|
| Landing | `/` | Public; adapts when signed in | **Built**: a live pixel scene matching the composition of references 07 and 08 (path, glowing tree, light shafts, fireflies); "Enter forest" and "View map" |
| Register | `/register` | Signed-out only | **Built**: validation, duplicate-email message, rate-limited |
| Sign in | `/login` | Signed-out only | **Built**: generic failure message, session-expired and account-deleted notices |
| Forgot password | `/forgot-password` | Signed-out only | **Built**. Production shows "unavailable" until an email provider is configured |
| Reset password | `/reset-password` | Signed-out, with emailed token | **Built**; revokes other sessions |
| Onboarding | `/onboarding` | Signed in, not yet onboarded | **Built**: name, font, motion, starting view, how the orchard works |
| Orchard | `/orchard` | Signed in and onboarded | **Built** (Milestone 1 world, both views); `?tree=<id>` opens a tree, `?plant=1` opens planting |
| Notebook | `/notebook` | Signed in and onboarded | **Built**: search, visit, water, edit, two-step delete; the accessible path to every thought (7.3) |
| Map | `/map` | Signed in and onboarded | **Built**: parchment map drawn by `buildMapModel` from the same world layout and stored positions; tap a tree to visit it; text list alternative |
| Settings | `/settings` | Signed in and onboarded | **Built**: name, plain font, motion, starting view, change password, sign out of other devices, log out, delete account |
| Support | `/support` | Public | **Built**: India resources, international fallback (23) |
| About | `/about` | Public | **Built (2026-10-13)**: what the app is and isn't, privacy, support |
| How to use | `/how-to-use` | Public | **Built (2026-10-13)**: planting, reading, growth, views and controls, Notebook and Map, settings |
| All pages (navigation) | `/navigation` | Public | **Built (2026-10-13)**: every page with a line about each; signed-in and signed-out lists differ |

**Site menu (2026-10-13):** a ⋯ button in the top bar of the home screen, the app pages and the guide pages opens the same list of pages (`features/site/siteLinks.ts`). The home screen and sign-in pages also link to About, How to use and All pages, and the orchard's More menu includes them.
| Not found / error | any unknown route; any failing page | Public | **Built** |

**Not built, by design:** a Backpack (no defined purpose, OD-25); sound (OD-16); a separate profile page (the profile is in Settings); any public, sharing or discovery page (excluded, 25.3).

The 3D orchard's in-world Notebook overlay was removed: the Notebook is one page with one URL. The orchard toolbar is Notebook · Map · Plant · View · More (Back to the path, Settings, Support, Log out).

### 28.2 Accounts and sessions (ADR-011)

- Better Auth with email and password on MongoDB. Passwords are hashed (scrypt) by Better Auth and never stored or logged in plaintext.
- Sessions are database-backed, 30 days, refreshed daily, in `httpOnly`, `SameSite=Lax` cookies; `Secure` with the `__Secure-` prefix in production. Expired sessions are removed by a TTL index.
- Sign-in, sign-up, password reset, password change and account deletion are rate-limited per client address (storage: MongoDB).
- Server-side resolution only: every API route and protected page reads the session cookie on the server. The client never supplies a user ID; `.strict()` validation rejects one.
- Each new account gets a profile and exactly one private orchard at sign-up (`databaseHooks.user.create.after`), with a lazy fallback for older accounts.
- Account deletion (Settings, password required) removes care events, thoughts, orchard and profile, then Better Auth removes the user, sessions and credentials (spec 17.4).
- Production refuses to serve auth or data without `MONGODB_URI`, `BETTER_AUTH_SECRET` (32+ characters) and `BETTER_AUTH_URL`; it answers 503 and logs only the names of missing variables.
- Email: Resend when `RESEND_API_KEY` and `EMAIL_FROM` are set. Without them, development prints reset links to the server console and production says reset is unavailable. Email verification can be required with `REQUIRE_EMAIL_VERIFICATION=true` once email works. **Neither has been tested against a real email provider.**

### 28.3 Data model additions

| Collection | Owner | Contents | Key indexes |
|---|---|---|---|
| `user` | Better Auth | name, email, emailVerified | `email` unique |
| `session` | Better Auth | token, userId, expiresAt, ip, user agent | `token` unique; `userId`; `expiresAt` TTL |
| `account` | Better Auth | credential (password hash), provider | `userId`; `providerId+accountId` |
| `verification` | Better Auth | reset / verification tokens | `identifier`; `expiresAt` TTL |
| `rateLimit` | Better Auth | per-address counters | `key` unique |
| `profiles` | App | `_id` = user ID, display name, onboardedAt, preferences | `_id` |
| `orchards` | App | one per user | `ownerId` unique |
| `thoughts` | App | as 9.1 | `orchardId+createdAt`; `userId+orchardId`; `userId+idempotencyKey` unique |
| `careEvents` | App | as 9.2 | `thoughtId+createdAt`; `userId+thoughtId`; `userId+idempotencyKey` unique |

**Preferences** (`profiles.preferences`): `plainFont`, `motion` (`system` / `reduce` / `full`), `startView` (`immersive` / `explorer`). The database is the source of truth. The browser caches only the font choice (so public pages match) and, per tab, where you last stood in the orchard.

**Initialisation:** indexes are created on every connection and by `npm run db:init` (idempotent). No other migration is needed; MongoDB collections are created on first write.

### 28.4 Exit criteria status

| Criterion | Status |
|---|---|
| Core loop works on desktop and a phone-sized browser | **Met**: end-to-end tests at 1366 px; layout checked at 375, 768, 1366 and 1920 px |
| Reloading changes nothing; growth follows the model when the clock moves forward | **Met**: e2e reload checks; dev clock check and unit tests |
| Nothing clips | **Met** for trunks and boundary (tests); the Explorer camera now clips the treetops just under it (ADR-009) |
| All automated tests pass | **Met**: see README "Tests" for the suite |
| Accounts: register, sign in, sign out, sessions, onboarding, isolation | **Met** (integration and end-to-end tests) |
| Separate pages with working navigation | **Met** (28.1) |
| Production build | **Met** (`next build`) |
| Product owner's visual review in the running build (20.9) | **Not yet done**: awaiting the product owner |
| Real deployment, real email delivery | **Not done**: needs hosting (OD-10) and provider credentials |
| Day 1 journal and original UML diagrams | **Not in the repository**: must come from the author |

---

## Final product definition

**Thought Orchard is a private, database-backed 3D landscape where every thought becomes a persistent tree. Users can explore their orchard, read and edit their thoughts, and nurture trees through meaningful care as the landscape evolves over time.**

The product succeeds when returning to an old thought feels like returning to a place.

It does not need a feed, a leaderboard, or an algorithm deciding which thought deserves attention. It needs a world that remembers.
