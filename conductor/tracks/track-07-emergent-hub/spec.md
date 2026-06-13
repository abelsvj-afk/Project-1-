# Specification: Emergent Hub & Fragment Assembly

## 1. Core Logic: The "Scene" vs. The "Event"
The current engine treats everything as a `Storylet`. We must split this into two layers:
- **The Scene (Base Layer)**: Assembled dynamically when entering a location. Uses `locationIntros` + `presence` + `npcActions` from `fragments.json`.
- **The Event (Top Layer)**: Procedural cards drawn from the "Deck". These are specific encounters (e.g., "A thief approaches", "An aetherial leak").

## 2. Dealing Mechanism (The Deck)
Replace the linear `filtered[0]` logic in `App.tsx` with a weighted deck:
- **Priority 1 (Plot)**: Hardcoded storylets with high priority (one-time use).
- **Priority 2 (World)**: NPC-specific interactions based on actual presence at the location.
- **Priority 3 (Procedural)**: Randomized wasteland/hub encounters.

## 3. Systemic Actions
The Hub UI will provide fixed buttons that are always available at major locations:
- **Scavenge**: Triggers a check against `Logic/Prowess` and deals a card from the `loot_tables.json` via narrative.
- **Socialize**: Forces an interaction with a present NPC, revealing `knownNames` and shifting `affinity`.
- **Rest/Trade**: Triggers economic interactions based on `wealth` and `inventory`.

## 4. State Invariants
- `currentStorylets` should no longer just be a list of IDs; it should represent the current "Deck" available to the player at their specific location.
- `seenStorylets` logic must be strictly enforced for plot storylets to prevent repetition.
