# 2026-10-12 — Accounts, pages and full verification (factual entry)

*Written by Claude Code as a factual record, per `docs/journal/README.md`. Not in the author's voice.*

## What was built

- Real accounts with Better Auth on MongoDB, replacing the single development identity. Sign-up creates a profile and one private orchard.
- Onboarding, and separate pages for the Notebook (with search), Map, Settings, password reset, not-found and errors.
- An isolated end-to-end test setup: the production build with a throwaway database.

## What went wrong along the way

- npm refused to install Better Auth because of optional peer dependencies for frameworks this app doesn't use. Resolved with `legacy-peer-deps`, recorded in `.npmrc`.
- The Better Auth MongoDB adapter turns transactions on by default, which a standalone MongoDB can't do. Made it a setting.
- In the hidden in-app browser, server-rendered pages behind a loading boundary never revealed, because React waits for an animation frame that a hidden pane never fires. Not an app bug; verified with headless Playwright instead.
- Three end-to-end failures were test selectors, not app defects: "Log out" also matched the More button's label, and Next.js's empty route announcer matched `role="alert"`.
- Overhead Explorer screenshots kept catching the camera mid-transition, because software WebGL renders only a few frames a second.

## Still open

- The author's Day 1 journal entry and original UML diagrams are still not in the repository.
- No deployment and no real email provider yet.
- Visual review by the author (spec 20.9).
