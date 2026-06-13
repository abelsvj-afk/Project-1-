# Implementation Plan: World Systems & NPC Autonomy

## Phase 1: Movement & Schedules
- [x] **Schedule Schema**: Defined `NPCSchedule` in `types/game.ts`.
- [x] **Simulation Loop**: Implemented `worldSimulationEngine.ts` to process NPC goal-switching.
- [x] **Redux Hooks**: Created `moveNPC` and `evolveNPC` reducers.

## Phase 2: Economics
- [ ] Implement the `economicEngine.ts` tick to process rent and tax modifiers.
- [ ] Connect `TradeMenu.tsx` to the dynamic price adjustment logic.

## Phase 3: Autonomy Integration
- [ ] Link NPC presence directly to the `dealFromDeck` narrative logic (Track 07).
- [ ] Implement "Off-screen Events" logging in `worldHistory`.
