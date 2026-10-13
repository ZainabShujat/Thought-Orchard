# Design references

Visual references for Thought Orchard, kept as historical design material (spec section 24). They are **mood and concept references, not specifications**: the product renders in pixel art (spec 18), and features that appear here are only requirements if the spec says so.

Never delete or edit these files. Add new reference sets in a new dated folder.

## 2026-10-12 (shared by the author)

| File | What it shows | Where it informs the spec |
|---|---|---|
| `01-growth-path-sprout-to-glowing-tree.webp` | A sprout on a path growing into a tree full of golden light | Growth stages (4), thought-tree glow (18.9) |
| `02-movement-wander-walk-sprint-transition.webp` | Wander, Walk, Sprint and Transition movement states | Movement modes (20.6) |
| `03-forked-path.webp` | A forked dirt path through dense undergrowth with fireflies | Paths and mood (18.9), regions (20.7) |
| `04-forked-path-triptych.webp` | Three variations of forking paths | Path composition (6.2) |
| `05-forest-paths-day-and-night.webp` | The same kind of path by day, mist, and night with a glowing tree | Time of day (21), glow (18.9) |
| `06-ui-board-explore-closeup-map-time.webp` | UI board: explore view, tree close-up with water/sun/wind icons, parchment map with regions, planting box, time-of-day overlay, toolbar (Backpack, Map, Notebook, Settings) | Views (20), map (20.5), care (5.4), interface (22) |
| `07-entrance-desktop.webp` | Desktop entrance: title, Enter forest, View map, Log in / Sign up | Entrance (22.1) |
| `08-entrance-mobile.webp` | Mobile entrance with the same actions | Entrance (22.1), mobile (17) |
| `09-time-of-day-and-cluster-from-afar.webp` | Morning, afternoon, evening, night; a glowing cluster of idea-trees seen from above | Time of day (21), Explorer view (20.3) |
| `10-tree-thought-bubble-and-region-signs.webp` | A glowing tree, its thought in a bubble, wooden region signposts | Tree inspection (22.3), regions (20.7) |
| `11-seven-growth-stages.webp` | The seven named growth stages | Growth stages (4, 18.5) |
| `12-post-explore-tend-crisis-resources.webp` | Posting a thought, exploring a map with a walking character, tending with care icons, a crisis resources screen | Explorer character (20.3), support page (23). Its "Anonymously shared" label is **not** a confirmed feature |
| `13-thought-trees-plant-bar.webp` | Blossoming trees carrying thought text beside a stream, with a planting bar | Mood (18.9), planting (3.1) |

## 2026-10-13 (shared by the author)

Shared with the request to match the painted look and to have the entities in the diagrams. Images identical to the 2026-10-12 set were not copied again.

| File | What it shows | Where it informs the spec |
|---|---|---|
| `14-forked-path-two-panel.webp` | Two views of a forked dirt path, cracked earth, fireflies in the undergrowth | Paths and ground (6.2) |
| `15-world-tree-player-components-mobile-desktop.webp` | Component board: world container, tree component with a thought bubble, player component, mobile and desktop UI with "Keep walking", parchment map | Views (20), interface (22) |
| `16-five-growth-stages.webp` | A five-stage growth sheet (New Thought, Tiny Sprout, Young Tree, Flourishing, Fully Grown) | Growth stages (4); the spec keeps seven |
| `17-winding-path-thought-trees-region-signs.webp` | A winding path with blossoming thought-trees, thought text near trees, region signs, a walking player, a plant bar | Regions (20.7), player (20.3), planting (22) |
| `18-uml-class-diagram-system.webp` | Class diagram: ThoughtOrchardSystem, Forest, Region, Tree, Thought, GrowthStage, TreeVisual, Camera/CameraMode, TimeEngine/TimeOfDay, InteractionController, Renderer, Resources | Domain model |
| `19-uml-class-diagram-simplified.webp` | A simplified version of the same class diagram | Domain model |
| `20-uml-tree-growth-state-diagram.webp` | Tree growth state diagram combined with the classes, including a Dormant state reached through neglect | Growth (4); see the decision register for Dormant |
