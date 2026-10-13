# 2026-10-12 — Milestone 1 foundation build (factual entry)

*Written by Claude Code as a factual record, per `docs/journal/README.md`. Not in the author's voice; the author may add their own entry.*

## What was built

- World layout with regions, planting sites and polyline paths; landscape-aware placement; `regionId` on thoughts; a tested map model.
- First-person Immersive view and an overhead Explorer view with a code-built explorer character, sharing one pose; walking with collision and terrain following.
- MongoDB persistence with a zero-setup local development database, ownership checks, idempotent create and water, retry-safe permanent deletion.
- Growth model Option C, derived on every read; watering interaction with droplets, brief leaf brightening, light points and a stage-change animation.
- Notebook (renamed Journal) with water, edit and delete; focus trapping; support page with India resources.
- 50 unit and integration tests, 2 end-to-end tests.

## What went wrong along the way

- A PowerShell edit wrote `package.json` with a byte-order mark; the running dev server cached the parse error until restarted.
- Setting `turbopack.root` in `next.config.ts` led to a runaway of PostCSS workers and an out-of-memory crash. Reverted.
- The first Explorer camera faced the sky: `Object3D.lookAt` points +Z at the target, cameras look down −Z. Fixed with `Matrix4.lookAt`.
- A placement test caught sites being skipped when random tries failed; a grid scan now proves a site is full.
- Watering droplets seemed broken during testing; the cause was a stale hot reload, not the code.

## Open for the author's visual review (spec 20.9)

- The explorer reads small at the 18 m minimum Explorer distance (P-04).
- On phones, small trees are framed just above the letter panel; may need more lift.
- The forest edge uses conical trees; the references show broadleaf woods.
- Light point size and brightness, mist density, sky banding.
