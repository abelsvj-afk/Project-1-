# Storylet Logic & Narrative Integration

This document maps how the lore and characters established in this track integrate with the QBN (Quality-Based Narrative) engine.

## 1. The Borderlands Wake (Initial Choice Integration)

The first choice in `track-01-arrival` must immediately establish the player's relationship with the three key factions/viewpoints in the Borderlands.

| Player Action | Thematic Alignment | Mechanical Effect | Local Reputation Shift |
| :--- | :--- | :--- | :--- |
| **Stabilize the Torch** (Help Kaelen via magic) | *Sync / Pure* | +10 Sync, +5 Prowess | +5 Adepts, -5 Syndicate, +10 Scavengers |
| **Fix the Wiring** (Help Kaelen via physics) | *Logic / Corrupt* | +10 Logic, -5 Purity | -5 Adepts, +5 Syndicate, +5 Scavengers |
| **Climb Out Silently** (Ignore Kaelen) | *Finesse / Neutral* | +5 Finesse | No immediate faction change, but Kaelen is wary. |

## 2. Core Storylet Categories

To ensure the Borderlands feels alive, we will implement three recurring "Storylet Types" that populate the player's QBN deck while they explore.

### A. Scavenger Encounters (The "Web of Trust")
- **Prerequisites:** Player is in the `borderlands_warrens`.
- **Content:** Encounters with local Blank Canvas citizens struggling with failing tech or illness.
- **Choices:** 
    - Use resources to heal/fix (Increases Purity, costs Wealth/Items).
    - Exploit their desperation for cheap parts (Decreases Purity, gains Items).
- **Goal:** Build the subjective Localized Reputation. High reputation unlocks a safe house.

### B. The Iron Watch Patrols (The Gauntlet)
- **Prerequisites:** `syndicate_menace` > 20 (e.g., player caused too much noise or stole scrap).
- **Content:** Overseer Vane's guards intercept the player.
- **Choices:**
    - Talk your way out (Requires high Logic).
    - Fight (Triggers the Affliction/Cure combat engine).
    - Bribe (Costs Wealth).
- **Goal:** Introduces "Menace" stats and the threat of the central authority.

### C. Static Leaks (Environmental Hazards)
- **Prerequisites:** Exploring the open `borderlands_desert`.
- **Content:** The player stumbles into an area where a spirit is burning out.
- **Choices:**
    - Use the *Echo-Anchor* to stabilize (Requires high Sync, grants a Resonance Shard).
    - Run away (Requires Finesse, avoids damage but loses the opportunity).
- **Goal:** Reinforces the "Arcane-Industrial" visual aesthetic and the risk of over-exploiting magic.
