# Thought Orchard
## Product Specification and Implementation Plan

**Version:** 1.0  
**Status:** Approved product direction, implementation-ready draft  
**Product type:** Personal spatial thought-journaling application  
**Primary platform:** Web  
**Architecture:** Next.js, React, TypeScript, Three.js, MongoDB  
**Core principle:** Ideas should have a place to exist without needing to perform.

---

# 1. Product Vision

## 1.1 The idea

**What if ideas were places instead of posts?**

Thought Orchard is a personal digital landscape where every thought becomes a tree. Users can walk through their orchard, discover and revisit thoughts, nurture them through symbolic interactions, and watch the landscape evolve over time.

Unlike a conventional notes application, Thought Orchard gives thoughts spatial identity. Unlike a social network, it does not depend on public engagement, popularity, or a continuously ranked feed.

The orchard is a living representation of the user's inner world.

## 1.2 Product thesis

> Twitter is a conversation. Thought Orchard is a memory landscape.

Thought Orchard exists to preserve thoughts, including incomplete ideas, passing observations, questions, reflections, and things that might matter later.

A thought does not need to be polished, published, or validated by other people to deserve a place.

## 1.3 Product goals

1. Make capturing a thought quick and effortless.
2. Give each thought a persistent, spatial presence.
3. Make exploring and revisiting thoughts meaningful.
4. Create a procedural 3D environment that feels organic and alive.
5. Support gentle growth through time and care.
6. Preserve the user's writing and world state reliably.
7. Keep the experience calm, private, and free from engagement pressure.

## 1.4 Non-goals

Thought Orchard is not intended to become:

- A social media feed.
- A public discussion platform.
- A productivity or task-management dashboard.
- A streak-based journaling product.
- A popularity-based discovery system.
- An AI-generated quote garden.
- A multiplayer world in its initial release.

---

# 2. Confirmed Product Decisions

The following decisions are locked for version 1.

| Decision | Confirmed choice |
|---|---|
| Orchard scope | Personal orchard |
| Rendering | Interactive 3D environment |
| Persistence | Backend and database |
| Thought editing | Supported |
| Creation timestamp | Preserved when editing |
| Tree placement | Automatically assigned |
| Tree positions | Stable across sessions |
| Environment assets | Generated procedurally in code |
| Primary interaction | Explore, select, read, and care for trees |
| Default privacy | Private |
| Experience | Spatial, calm, non-performative |

### 2.1 Confirmed exclusions

Version 1 will not include public feeds, comments, replies, likes, reposts, popularity rankings, notifications, streaks, AI categorization, multiplayer, or elaborate seasonal simulation.

Sunlight and wind are part of the broader conceptual vision but are not MVP requirements.

Procedural generation is required for the environment itself. Static screenshots or a collection of pasted tree images cannot substitute for an interactive orchard.

---

# 3. Core Domain Model

The fundamental relationship is:

**User → Orchard → Thoughts → Trees**

Each thought is a persistent record. Each tree is its visual representation in the orchard. A tree must retain its identity and position even when the application is closed and reopened.

The renderer is responsible for displaying the world. It must not own the authoritative thought data or business logic.

## 3.1 Thought lifecycle

1. The user creates a thought.
2. The backend validates and persists it.
3. A tree is assigned a stable position in the orchard.
4. The 3D renderer displays the tree.
5. The user selects the tree to read its thought.
6. The user may edit the thought while retaining its creation timestamp.
7. Care interactions are recorded against the thought.
8. Growth appearance is calculated from the persisted state.
9. The thought and its tree remain available on subsequent visits.

## 3.2 Editing behavior

Editing changes the thought's content and `updatedAt` timestamp.

Editing must not:

- Change the thought's ID.
- Reset `createdAt`.
- Randomize the tree's position.
- Create a duplicate tree.
- Erase its care history.
- Reset its growth state without an explicit rule.

The original creation date remains visible in the thought detail view.

## 3.3 Deletion

Deletion is a supported data-management requirement, but its exact interaction is an open UX decision. If implemented, deletion must require an explicit confirmation and remove the thought from the orchard without leaving an interactive orphaned tree.

A deletion strategy must be selected before implementing the endpoint.

---

# 4. User Experience and Interaction Specification

## 4.1 Orchard view

The orchard is the primary application experience.

It must contain:

- A procedural 3D ground surface.
- Trees representing saved thoughts.
- Trunks, branches, foliage, and appropriate environmental detail.
- Ground vegetation and paths where appropriate.
- Spatial depth, lighting, and atmospheric variation.
- Camera controls for navigating the landscape.
- A clear action to plant a new thought.
- A way to open a tree's thought details.
- A restrained interface that does not compete with the environment.

Trees must be positioned deterministically from stored coordinates. The world must not reshuffle every time it loads.

### Navigation

The user must be able to:

- Move the camera around the orchard.
- Pan or navigate across the environment.
- Zoom in and out within sensible limits.
- Select individual trees.
- Return to a comfortable overview after inspecting a tree.

The implementation must prevent camera controls from interfering with tree selection.

### Spatial organization

The first version uses automatic placement.

Tree positions should be assigned by a deterministic placement service that considers existing positions and a minimum spacing threshold.

A practical initial strategy is deterministic Poisson-disc-style placement or another collision-aware distribution method. The chosen algorithm must:

- Avoid excessive tree overlap.
- Produce a natural-looking distribution.
- Use a fixed seed or persist assigned coordinates.
- Remain stable when the orchard is reopened.
- Add new trees without moving existing trees.
- Handle increasing tree counts without a full-world regeneration.

The user does not manually arrange trees in version 1.

## 4.2 Plant thought view

The creation interface should provide:

- A text area for the thought.
- A save action.
- A cancel action.
- Clear validation feedback.
- A saving indicator.
- A success state after persistence is confirmed.

The user is not required to provide a title, tags, category, mood, or other metadata.

The writing interface should be lightweight and should not feel like filling out a form for the government.

## 4.3 Thought detail view

Selecting a tree opens a focused detail panel or modal.

It displays:

- The complete thought content.
- Creation date.
- Last edited date when applicable.
- Current tree growth stage.
- Available care interactions.
- An edit action.
- A return-to-orchard action.

The interface must preserve the user's camera position when opening and closing a detail view, where technically practical.

## 4.4 Care interaction

Watering is the first care interaction.

When the user waters a tree:

1. The interaction is sent to the backend.
2. The backend validates and records it.
3. The persisted care state is updated.
4. The frontend displays immediate feedback after a successful response.
5. The tree's appearance reflects the updated growth state.

Duplicate requests must not accidentally create multiple care events when a request is retried.

The exact repeat-watering limits and growth formulas are open decisions. The first implementation should use a simple, documented rule rather than an opaque engagement score.

## 4.5 Accessibility and alternatives

The 3D orchard must not be the only way to access a thought.

Provide accessible interaction labels and a keyboard-accessible list or equivalent alternative for selecting thoughts. Support reduced-motion preferences, visible focus, and readable text independent of the 3D scene.

---

# 5. Visual and Environmental Specification

## 5.1 Art direction

The visual language should be:

- Organic rather than geometrically sterile.
- Calm rather than attention-grabbing.
- Spatial rather than card-based.
- Warm, muted, and atmospheric.
- Detailed enough to feel alive, but restrained enough to remain performant.

A starting palette may use sage greens, warm earth tones, soft creams, and restrained amber lighting. These are initial art-direction choices, not a final brand palette.

## 5.2 Procedural environment

The 3D environment must be constructed from code-generated geometry and materials.

Required environment elements:

- Ground.
- Trees.
- Trunks and branches.
- Foliage.
- Roots where appropriate to the chosen visual style.
- Grass or low vegetation.
- Paths or clear navigation corridors.
- Lighting and atmospheric depth.

Procedural generation does not mean every element must be generated from scratch on every frame. Reusable geometry, instancing, deterministic seeds, and shared materials should be used to control rendering cost.

## 5.3 Tree representation

Every tree has two distinct components:

**Logical tree**
- Thought ID.
- Position.
- Growth state.
- Care history.
- Stable identity.

**Visual tree**
- Geometry and materials.
- Growth-stage appearance.
- Selection state.
- Optional animation.
- Rendering resources.

The logical tree persists in the database. The visual tree is reconstructed from that data when the orchard loads.

A rendering refactor must never change a thought's identity or stored position.

## 5.4 Growth stages

The visual system should support multiple growth stages, at minimum:

- Sapling.
- Young tree.
- Mature tree.

Exact age thresholds and care contributions remain configurable until the growth model is finalized.

Growth calculations should be deterministic and derived from persisted timestamps and care events. The world must not require a continuously running process to update a tree's age.

Trees must never die or visually punish the user merely because they have not visited the application.

## 5.5 Performance requirements

The renderer should:

- Reuse geometry and materials.
- Use instancing where suitable.
- Limit unnecessary animation.
- Dispose of resources when they are no longer needed.
- Avoid rebuilding the entire world for a single thought update.
- Support incremental loading as the orchard grows.
- Keep UI interactions responsive during rendering.

A numerical performance budget should be established after a working scene is profiled on representative desktop and mobile devices.

---

# 6. Technical Architecture

## 6.1 Recommended stack

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| 3D rendering | Three.js with React Three Fiber |
| 3D utilities | Drei, where useful |
| API | Next.js Route Handlers |
| Database | MongoDB |
| Data access | Mongoose or the official MongoDB driver |
| Validation | Zod or an equivalent schema validator |
| Testing | Vitest and an end-to-end testing tool such as Playwright |

This keeps the application aligned with a React/TypeScript workflow while using Three.js for the 3D environment.

The architecture can retain a separate Express service if the existing repository requires it. It should not introduce a second backend merely for architectural decoration.

## 6.2 High-level architecture

```text
Browser
  |
  +-- Next.js UI
  |     |
  |     +-- Thought creation and editing
  |     +-- Thought detail view
  |     +-- Accessible thought list
  |     +-- Orchard navigation controls
  |
  +-- React Three Fiber / Three.js
        |
        +-- Scene and camera
        +-- Ground and paths
        +-- Procedural tree geometry
        +-- Tree selection and raycasting
        +-- Growth appearance
              |
              v
       Next.js Route Handlers
              |
              +-- Request validation
              +-- Ownership checks
              +-- Thought services
              +-- Placement service
              +-- Care and growth services
                       |
                       v
                    MongoDB
```

## 6.3 Architectural boundaries

**UI layer:** Forms, panels, navigation, accessible alternatives, and presentation state.

**Rendering layer:** 3D scene, camera, geometry, materials, selection, and visual animation.

**Domain layer:** Thought creation, editing, placement, care, and growth rules.

**Persistence layer:** Database connections, repositories, and data serialization.

**API layer:** Authentication, validation, authorization, error handling, and service invocation.

The rendering layer must not directly query the database. The UI must not independently invent authoritative growth values.

## 6.4 Proposed repository organization

```text
src/
├── app/
│   ├── page.tsx
│   ├── orchard/
│   │   └── page.tsx
│   └── api/
│       ├── thoughts/
│       │   └── route.ts
│       └── thoughts/
│           └── [id]/
│               ├── route.ts
│               └── care/
│                   └── route.ts
├── components/
│   ├── ui/
│   ├── thoughts/
│   └── orchard/
├── features/
│   ├── thoughts/
│   ├── placement/
│   └── care/
├── rendering/
│   ├── OrchardCanvas.tsx
│   ├── scene/
│   ├── trees/
│   ├── environment/
│   ├── camera/
│   └── interaction/
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

The exact directories may adapt to the existing repository. The separation of rendering, domain rules, and persistence is the important requirement.

---

# 7. Database Design

MongoDB is the authoritative source of truth for saved thoughts, their positions, and care history.

## 7.1 Thought document

```ts
type Thought = {
  _id: string;
  orchardId: string;
  userId: string;
  content: string;

  position: {
    x: number;
    z: number;
  };

  placementSeed?: number;

  createdAt: Date;
  updatedAt: Date;

  growthState: {
    stage: "sapling" | "young" | "mature";
  };

  deletedAt?: Date | null;
};
```

The database may store growth inputs and derive the displayed stage at read time. It must not maintain conflicting versions of the same growth state.

`x` and `z` define the tree's horizontal position in the 3D world. The renderer derives its vertical placement from the ground surface and tree geometry.

## 7.2 Care event document

```ts
type CareEvent = {
  _id: string;
  thoughtId: string;
  orchardId: string;
  userId: string;
  type: "water";
  createdAt: Date;
  idempotencyKey: string;
};
```

Care events are stored separately so the application can retain a history without repeatedly expanding a single thought document.

## 7.3 Orchard document

```ts
type Orchard = {
  _id: string;
  ownerId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  placementVersion: number;
};
```

Version 1 supports one personal orchard per user. The data model can support more later without implementing shared orchards now.

## 7.4 Data integrity requirements

- Every thought belongs to one orchard and one owner.
- Every tree position is persistent.
- Thought IDs remain stable across edits.
- Care events reference existing thoughts.
- Database timestamps use a consistent UTC representation.
- Creation timestamps are immutable through ordinary update operations.
- Queries enforce ownership and orchard boundaries.
- Deletion and care operations cannot leave inconsistent references.

Recommended indexes include:

- Orchard ID and creation timestamp.
- Owner ID and orchard ID.
- Care events by thought ID and timestamp.
- A unique idempotency key scoped to the relevant owner or request context.

---

# 8. API Specification

All endpoints use JSON and consistent error responses.

Authentication and authorization must be applied before public deployment. In development, the application may run with a configured single-user identity, but production must not trust a user ID supplied by the browser.

## 8.1 Create thought

`POST /api/thoughts`

Request:

```json
{
  "content": "What if ideas were places instead of posts?"
}
```

Behavior:

1. Validate and normalize the input.
2. Resolve the authenticated user and orchard.
3. Allocate a collision-aware position without moving existing trees.
4. Persist the thought.
5. Return the saved thought and its position.

Response: `201 Created`.

The position allocation and thought creation must be atomic enough to avoid inconsistent records under concurrent requests.

## 8.2 List thoughts

`GET /api/thoughts`

Returns the authenticated user's thoughts for the orchard.

The response contains stable IDs, content, timestamps, positions, and the information required to reconstruct tree appearance.

Pagination or spatial chunking may be introduced as scale requires it.

## 8.3 Retrieve a thought

`GET /api/thoughts/:id`

Returns one thought if it belongs to the current user and orchard.

## 8.4 Edit a thought

`PATCH /api/thoughts/:id`

Request:

```json
{
  "content": "Updated thought text"
}
```

Behavior:

- Validate the new content.
- Update `content` and `updatedAt`.
- Preserve `createdAt`, `_id`, position, and care history.
- Return the updated thought.

The client must not be allowed to overwrite system-managed fields such as `userId`, `createdAt`, or `position` through this endpoint.

## 8.5 Water a thought

`POST /api/thoughts/:id/care`

Request:

```json
{
  "type": "water",
  "idempotencyKey": "unique-request-key"
}
```

Behavior:

- Verify ownership.
- Validate the interaction.
- Prevent duplicate processing of the same request.
- Persist the care event.
- Return the updated care and growth information.

## 8.6 Delete a thought

`DELETE /api/thoughts/:id`

This endpoint may be implemented once the deletion behavior is confirmed. It must verify ownership and use a consistent deletion strategy.

## 8.7 Error handling

Use consistent HTTP statuses:

- `400` for invalid input.
- `401` for unauthenticated requests.
- `403` for unauthorized access where disclosure is appropriate.
- `404` for missing or inaccessible resources.
- `409` for conflicting operations where applicable.
- `429` for rate-limited requests.
- `500` for unexpected server failures.

Error responses must not expose database credentials, stack traces, or private records.

---

# 9. Security, Privacy, and Reliability

Thoughts are private by default.

Requirements:

- Never expose another user's thoughts through public endpoints.
- Validate every request on the server.
- Enforce ownership for read, edit, care, and delete operations.
- Keep database credentials in environment variables.
- Exclude secrets from source control.
- Use secure session handling when authentication is enabled.
- Apply request size limits and input validation.
- Prevent accidental duplicate care events.
- Avoid logging full private thought content unnecessarily.
- Confirm database writes before presenting them as saved.

A publicly deployed application must have a defined authentication mechanism and secure session configuration. A single-user development mode is not sufficient production security.

---

# 10. Non-Functional Requirements

## Persistence
Thoughts, positions, and care history survive reloads, navigation, and application restarts.

## Stability
Existing trees never move merely because another thought is created.

## Responsiveness
UI controls remain responsive while the scene renders. Expensive geometry generation must not block routine interactions unnecessarily.

## Accessibility
Core functions remain available without relying exclusively on mouse-based 3D navigation.

## Resilience
A failed save produces a clear error and preserves the user's draft where possible.

## Maintainability
Growth rules, placement logic, database access, and rendering are separated into testable modules.

## Portability
The application can be deployed using environment-based configuration without hardcoded local paths or credentials.

## Observability
Development logs and tests make failures in persistence, placement, and rendering diagnosable without unnecessarily recording private thought text.

---

# 11. Testing Strategy

## 11.1 Unit tests

Test:

- Input validation.
- Tree placement and minimum spacing.
- Placement stability when adding new thoughts.
- Growth-stage calculations.
- Care event idempotency.
- Thought editing and immutable creation timestamps.
- Authorization and ownership checks.

## 11.2 Integration tests

Test:

- Database connection and persistence.
- Creating and retrieving a thought.
- Editing without moving the tree.
- Recording care and retrieving the updated state.
- Invalid input handling.
- Access attempts across different users.
- Concurrent thought creation and position allocation.

## 11.3 End-to-end tests

Verify that a user can:

1. Open the orchard.
2. Plant a thought.
3. See its tree appear.
4. Select the tree and read the thought.
5. Edit the thought.
6. Reload the application.
7. Confirm the content and tree position are unchanged.
8. Water the tree and see feedback.
9. Reopen the thought and confirm persistence.

## 11.4 Rendering tests

Verify:

- The scene initializes without fatal errors.
- Trees are selectable.
- Camera navigation does not trigger accidental selection.
- Selection feedback is visible.
- Tree placement does not create severe overlap.
- Scene resources are released appropriately.
- The application has a usable fallback when WebGL is unavailable.

---

# 12. MVP Acceptance Criteria

The MVP is complete when every P0 criterion below passes.

### Thought management
- [ ] A user can create and persist a thought.
- [ ] A user can read a saved thought.
- [ ] A user can edit it without changing its creation timestamp.
- [ ] Editing preserves its ID, position, and care history.
- [ ] Failed writes do not silently discard text.

### Three-dimensional orchard
- [ ] The environment is generated from code.
- [ ] The scene contains interactive trees, ground, and supporting environmental elements.
- [ ] Each saved thought has a corresponding tree.
- [ ] Trees are assigned automatically.
- [ ] Existing tree positions remain stable after adding thoughts and reloading.
- [ ] Camera navigation and tree selection work reliably.

### Care and growth
- [ ] A user can water a tree.
- [ ] Care interactions persist.
- [ ] Duplicate retries do not create duplicate events.
- [ ] Tree appearance reflects the documented growth model.
- [ ] Inactivity does not kill or punish a tree.

### Quality and privacy
- [ ] Core interactions work on supported desktop browsers.
- [ ] The interface is usable on mobile layouts.
- [ ] An accessible alternative to 3D-only thought selection exists.
- [ ] Private thoughts cannot be accessed by unauthorized users.
- [ ] Automated tests cover core domain logic and API behavior.

---

# 13. Implementation Plan

## Phase 1: 3D rendering prototype

Build the scene before building the entire application.

Deliverables:
- Next.js and React Three Fiber setup.
- Camera and navigation.
- Procedurally generated ground, paths, grass, and trees.
- Tree selection.
- Stable seeded placement using sample data.
- A basic responsive interface.

Exit criterion: a navigable 3D orchard with selectable trees and no static landscape image serving as a substitute for the environment.

## Phase 2: Persistence and thought lifecycle

Deliverables:
- MongoDB connection.
- Thought schema and repository.
- Create, list, retrieve, and edit endpoints.
- Stable position assignment.
- Thought creation and detail interfaces.
- Database-backed restoration of the orchard.

Exit criterion: a thought can be created, edited, and recovered after reload without changing tree identity or position.

## Phase 3: Care and growth

Deliverables:
- Care event model.
- Watering endpoint.
- Idempotency handling.
- Documented growth rules.
- Tree appearance derived from persisted state.

Exit criterion: watering and growth survive reloads and behave consistently.

## Phase 4: Reliability and polish

Deliverables:
- Authentication and authorization for deployment.
- Accessible thought list and keyboard interactions.
- Error and loading states.
- Responsive layout refinements.
- Automated tests and rendering performance checks.
- Deployment configuration and documentation.

Exit criterion: the application meets the acceptance criteria and can be deployed without exposing private data.

## Phase 5: Future exploration

Potential future work:
- Sunlight and wind interactions.
- Richer tree growth.
- Multiple personal orchards.
- Search and spatial navigation for large collections.
- Carefully designed sharing, if it remains consistent with the original philosophy.

These features must not delay the first working orchard.

---

# 14. Open Decisions Register

The following decisions remain open. They must not be silently treated as finalized requirements.

| ID | Decision | Proposed default | Required before |
|---|---|---|---|
| OD-01 | Authentication provider | Select based on deployment and repository setup | Public deployment |
| OD-02 | 3D art style | Stylized, low-complexity organic geometry | Visual polish |
| OD-03 | Growth formula | Time-based baseline plus bounded care influence | Phase 3 |
| OD-04 | Watering limits | Simple documented repeat-action rule | Phase 3 |
| OD-05 | Thought length limits | Define server-side validation limits | Phase 2 |
| OD-06 | Deletion behavior | Confirmed deletion with explicit warning | Delete implementation |
| OD-07 | Tree collision strategy | Collision-aware automatic placement | Phase 1 |
| OD-08 | Rendering performance budget | Establish through profiling | Phase 4 |
| OD-09 | Production hosting | Choose based on the existing repository and database setup | Deployment |
| OD-10 | Camera behavior | Comfortable third-person or elevated exploration camera | Phase 1 |

Open decisions do not permit changes to the confirmed product vision. They concern implementation details and interaction rules.

---

# 15. Definition of Done

A feature is not complete merely because the page renders.

A feature is done when:

1. Its behavior matches this specification.
2. Its state is persisted where required.
3. Its errors are handled explicitly.
4. Its tests pass.
5. It does not break existing thought identities or positions.
6. It respects ownership and privacy.
7. Its documentation is updated when architectural decisions change.

The repository should maintain a changelog and an architecture decision record. Agents working on the project should update those documents when they change implementation details, but must not silently rewrite the product vision or confirmed decisions.

---

# Final Product Definition

**Thought Orchard is a private, database-backed 3D landscape where each thought becomes a persistent tree. Users can explore their orchard, read and edit their thoughts, and nurture trees as the landscape evolves over time.**

The product succeeds when returning to an old thought feels like returning to a place.

It does not need a feed, a leaderboard, or an algorithm deciding which thought deserves attention. It needs a world that remembers.