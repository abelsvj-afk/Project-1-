# Track: Emergent Hub & Fragment Assembly

## Status
In Progress

## Description
Finalizing the pivot from static storylets to a systemic, generation-based narrative engine. This includes implementing the "Event Deck" for procedural encounters and transforming the UI into a persistent Hub that interacts with world simulation.

## Objectives
1. **Full Fragment Migration**: Remove static text blocks and utilize `assembleProse` for all "Hub" entries.
2. **Systemic Hub UI**: Refactor `App.tsx` to distinguish between "Scenes" (assembled fragments) and "Events" (procedural deck cards).
3. **World State Integration**: Link `worldSimulationEngine.ts` directly to the narrative dealing logic (NPC presence checks).
4. **Mechanical Engagement**: Enable [SCAVENGE], [WORK], and [SOCIALIZE] as systemic actions that trigger specialized procedural sub-engines.

## Documentation
- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
