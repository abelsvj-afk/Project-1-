# Eldoria: Systemic Pitfall Analysis

This document tracks critical RPG systems identified as "missing" or "under-developed" during planning, ensuring the game achieves deep simulation rather than shallow text output.

## 1. Magic Typology & Catalysts
**Requirements:**
- Integrated **Anime Elemental** manifestations (Fire, Ice, Earth, Wind, etc.) into the four scientific "Currents."
- Define the "Catalysts." Does the player need a wand, an Arcane-Industrial brass gauntlet, or can they cast bare-handed at the cost of health?

## 2. The Political System & Civic Influence
**Requirements:**
- A **Tri-Axis Power** system: Warfare, Civic Governance, and Underworld Brokerage.
- Mechanics for the player to intermingle across all tiers with cascading consequences.

## 3. Dynamic Identity Tracking (Character Creator)
**Requirements:**
- A robust UI for Character Creation (Name, Pronouns, Body Type, Hair Color, Facial Features).
- A dynamic Wardrobe System. If the player equips a "Heavy Leather Duster," NPCs must reference it in the procedural text.

## 4. The "Isekai" Logic Gap
**Requirements:**
- A "Blueprint" system where the player can "invent" Earth concepts (like germ theory, steam power, or double-entry bookkeeping) to solve Eldorian problems.

## 5. Economic Hyper-Inflation
**Requirements:**
- "Maintenance Costs" and "Upkeep" for owned buildings.
- Faction-based "Economic Sanctions."

## 6. Seeded Personality Depth
**Requirements:**
- Each major NPC needs a "Seeded Personality Matrix" governing their vocabulary and visual tells.

## 7. NEW: Systemic World Consistency (Cascading Triggers)
**The Pitfall:** If you unseat a Mayor (Tier 2), but the Syndicate guards (Tier 1) don't react, the world feels dead.
**Requirements:**
- A "Global Event Dispatcher" that ensures actions in one political tier trigger immediate status shifts in others.

## 8. NEW: Narrative Tutorialization (The Inner Monologue)
**The Pitfall:** Too many systems can overwhelm the player.
**Requirements:**
- Use the player's "Inner Monologue" (Modern Logic) as the tutorial system. The character "thinks" in Earth terms to explain the alien systems of Eldoria.

## 9. NEW: TTS Monologuing
**The Pitfall:** Long storylets with multiple speakers will use the first detected voice profile for the entire block, breaking immersion during dialogues.
**Requirements:**
- Split storylet content by speaker tags and queue multiple TTS utterances with different profiles for a single storylet.

## 10. NEW: State Bloat (Seen Storylets)
**The Pitfall:** In an "endless" RPG, the `seenStorylets` array will grow until it impacts performance or save-file size.
**Requirements:**
- Implement a "Pruning" logic or move "Seen" status into a more efficient bitmask/hash if the storylet IDs are sequential.

## 11. NEW: Priority Deadlocks
**The Pitfall:** Multiple storylets with the same high priority will still feel predictable (always the same one first).
**Requirements:**
- Introduce a "Tie-Breaker" (randomization or weight-based shuffle) for storylets with identical priority levels.
