# Spec: Magic Typology & Combat Engine

## Goals
1. **Magic Data Structure:** Define the `Four Currents` (Thermal Entropy, Vector Resonance, Biomorphic Flux, Cognitive Distortion) in the data layer.
2. **Combat Engine Core:** Implement the real-time action economy. Managing `Balance` (physical readiness) and `Equilibrium` (mental composure) using a ticking game loop.
3. **Affliction & Cure Matrix:** Create a robust system where enemies apply physiological/psychological afflictions, requiring the player to use specific cures (salves, herbs, elixirs) via the correct delivery mechanism.
4. **Combat UI:** Build a real-time combat log and a tactical dashboard displaying the player's current Balance, Equilibrium, and active Afflictions.

## Key Deliverables
- `Data:` `combatData.json` expanding the afflictions and cures list.
- `State:` Update `playerSlice` and `gameSlice` for real-time combat states.
- `Engine:` A `combatEngine.ts` loop that processes ticks (e.g., 100ms intervals) to handle cooldowns and continuous affliction damage.
- `UI:` A `CombatConsole` component.
