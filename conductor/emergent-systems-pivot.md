# Plan: Emergent Narrative & Autonomy Pivot

## Background & Motivation
The current architecture relies on monolithic, static JSON storylets. While functional, it leads to repetitive gameplay ("stalls") and lacks the organic "spider-web" feel of a living world. Furthermore, as mandated in `GEMINI.md`, all new mechanics must be rigorously verified via automated simulations. This plan outlines the pivot to an Algorithmic Fragment Assembly system combined with autonomous NPC simulation.

## Scope & Impact
- **Narrative Engine**: Complete overhaul to assemble text dynamically from fragments rather than loading static blocks.
- **World Simulation**: New engine to handle NPC movement, faction warfare, and time-based events occurring off-screen.
- **State**: Expansion to support complex knowledge graphs and NPC coordinates.
- **Verification**: A dedicated suite of `tsx` scripts to automatically test fragment logic and NPC movement.

## Proposed Solution: Algorithmic Fragment Assembly

### 1. Dynamic NPC Movement (The Living Map)
NPCs will no longer just be "tags" in a storylet.
- **NPC Entity State**: Add a tracking slice in Redux (`game.npcs`) that records their current `locationNode`, `goal`, and `disposition`.
- **Background Simulation**: On every player tick/action, the `WorldSimulationEngine` rolls to move NPCs across the `world_map.json` connections. If Kaelen moves to the Warrens, Kaelen-specific fragments will only trigger if the player is also in the Warrens.

### 2. Fragment Assembly Engine
Storylets are no longer paragraphs. They are "Events" composed of fragments.
- **Base Context**: "You are at the [Location]."
- **Actor Injection**: "You see [NPC 1] and [NPC 2]." (Only if they are physically at that node).
- **Faction State**: "The Syndicate banners are torn." (If Faction Menace > 50).
- **Player History**: "Your scars ache in the cold." (If player has 'frostbite_scars').
- **The Engine**: `assembleProse(state, eventId)` will stitch these fragments together intelligently, ensuring the text reads naturally while reflecting 10+ variables simultaneously.

### 3. Spider-Web Continuity
- Instead of linear prerequisites (`lastChoiceId`), we will use a **Tag-Weighting System**. 
- Fragments and Events possess tags (`[combat_heavy]`, `[pro_syndicate]`, `[mystical]`).
- The player's actions build a hidden "Context Profile." The Engine prioritizes loading Events/Fragments that match or directly conflict with that profile to create dramatic tension.

## Phased Implementation Plan

### Phase 1: World & NPC Simulation Layer
- Create `src/engine/worldSimulationEngine.ts`.
- Implement background ticking for NPC movement across the map nodes.
- Update Redux state to hold NPC locations.
- **Verification**: Write `tests/simulate_world.ts` to run 100 turns headless and verify NPCs move logically without crashing.

### Phase 2: Fragment Engine Overhaul
- Rewrite `storylets.json` schema into `fragments.json` and `events.json`.
- Develop the algorithm to stitch sentences cleanly (handling punctuation and transitions).
- Update the UI to render assembled Events.
- **Verification**: Write `tests/simulate_prose.ts` to test millions of state combinations and catch "grammar crashes" or empty outputs.

### Phase 3: Integration & Content Creation
- Delete the old static storylets.
- Port the "Crater" and "Outpost" scenarios into the new Fragment system.
- Hook up the Procedural Loot Engine to the new Event choices.

## Migration & Rollback
- Since this fundamentally changes the data structure, existing save states (if any existed outside memory) would break. 
- The old `narrativeEngine.ts` and `storylets.json` will be kept in a `.bak` folder until Phase 3 is verified via simulations.