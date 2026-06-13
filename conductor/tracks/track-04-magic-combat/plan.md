# Implementation Plan: Magic Typology & Combat

## Phase 1: Data & State Scaffolding
- [ ] Define the Magic Typology interfaces in `types/game.ts`.
- [ ] Expand `combatData.json` to include specific Arcane-Industrial spells, afflictions (e.g., Paralysis, Shivering), and cures (e.g., Bloodroot, Caloric Salve).
- [ ] Implement the Redux actions for consuming cures and applying afflictions.

## Phase 2: The Action Economy (Engine)
- [ ] Build the `useCombatLoop` hook (or background engine) that ticks every 100ms to recover Balance and Equilibrium.
- [ ] Implement spellcasting/attacking logic that drains Balance/Equilibrium and applies effects based on target's state.

## Phase 3: Combat UI & Real-Time Log
- [ ] Build the `CombatConsole` React component featuring a scrolling, colored text log (e.g., Red for damage, Green for healing).
- [ ] Build the tactical dashboard showing Balance/Equilibrium bars and active Affliction icons.
- [ ] Wire up UI buttons for quick-consuming cures.

## Phase 4: Verification
- [ ] Task: Conductor - User Manual Verification 'Magic & Combat' (Protocol in workflow.md)
