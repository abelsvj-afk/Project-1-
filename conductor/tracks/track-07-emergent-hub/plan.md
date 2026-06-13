# Implementation Plan: Emergent Hub & Fragment Assembly

## Phase 1: Engine Foundation
- [x] **Deck dealing logic**: Update `narrativeEngine.ts` to include a `dealFromDeck` function that handles weights and repetition protection. [cfd726b]
- [x] **Simulation Hookup**: Modify `App.tsx` to check `game.npcs` locations before assembling the Scene. [61306ae]

## Phase 2: Hub Transformation
- [ ] **Systemic UI Layout**: Refactor the Narrative view to show the "Base Scene" (Assembled Prose) at the top, followed by "Systemic Actions" (Fixed buttons for Scavenge/Socialize/etc).
- [ ] **History Consolidation**: Ensure `historyEngine.ts` is called regularly to prevent the Redux state from bloating with procedural fragments.

## Phase 3: Content Migration
- [ ] **Scavenge Deck**: Create a set of fragment-based storylets in `storylets.json` tagged as `type: repeatable_scavenge`.
- [ ] **NPC Social Deck**: Create generic social templates that fill in `{npc:id}` based on who is present.
- [ ] **Deprecation**: Safely delete the static `market_hub_main` and `crater_wake_repeat` storylets.

## Phase 4: Validation
- [ ] **New Simulation**: Create `tests/simulate_hub_loop.ts` to verify that the player can Scavenge/Socialize 50 times without encountering a "Story Stall" or identical repetition.
