# NPC Autonomy & Narrative Pacing Overhaul

## 1. The Pitfall: Pacing & The "Shonen Escalation"
Currently, Director-General Thorne arrives at the Outpost Market almost immediately. This violates standard RPG/Shonen power-scaling tropes. High-status villains do not do the grunt work.

**The Solution: The Chain of Command**
We must implement "Cogs in the Machine." The player must climb the hierarchy, building tension before meeting the Sovereign.

1.  **Tier 1: The Grunts (Level 1-5)**
    *   *Examples*: Syndicate Enforcers, Scavenger Thugs, Feral Spirits.
    *   *Interaction*: They harass the player for basic infractions (e.g., "leaking static"). They are easily defeated or bribed.
2.  **Tier 2: The Specialists (Level 5-15)**
    *   *Examples*: Syndicate Hounds (Trackers), Adept Zealots, Corrupted Machinists.
    *   *Interaction*: Sent when Grunts fail or go missing. They use specific tactics (e.g., smoke bombs, targeted elemental spells).
3.  **Tier 3: The Lieutenants (Level 15-30)**
    *   *Examples*: Captain Vane (Local Overseer), The Iron Twins.
    *   *Interaction*: Major boss fights. They control regions. Defeating them causes global consequences.
4.  **Tier 4: The Apex / Director-General Thorne (Level 50+)**
    *   *Interaction*: Only appears at catastrophic inflection points or when summoned by a Lieutenant's death.

## 2. Deep Character Sheets (NPC Metadata)
To support this, NPCs can no longer be simple text strings. They must have deep systemic data mirroring the player, allowing for real systemic combat and interactions.

```typescript
interface DeepNPC {
  id: string;
  name: string;
  title: string;
  level: number;
  factionId: string;
  statusTier: 1 | 2 | 3 | 4; // Grunt to Boss
  stats: PlayerStats; // Prowess, Logic, Finesse, Sync
  affinities: string[]; // Elements they resist/are weak to
  inventory: string[]; // Loot drops
  personality: {
    archetype: 'coward' | 'zealot' | 'pragmatist' | 'predator';
    braveryThreshold: number; // Morale system: when do they flee?
    vocabulary: string[];
  };
  simulatedState: {
    currentAction: string;
    goal: string; // e.g., "patrol_market", "hunt_player"
  };
}
```

## 3. Simulated Autonomy (No AI APIs)
To make the world feel alive without using LLM APIs, we will use a **Goal-Oriented Action Planning (GOAP)** lite system running on the `processEconomicTick`.

*   **Needs/Goals**: NPCs are assigned a current "Need" (e.g., Hunger, Duty, Hunt).
*   **Schedules as Baselines**: The current schedule acts as their default state.
*   **Interrupts (Event Listeners)**: If the player creates high Menace in a region, Tier 2 NPCs interrupt their "patrol" schedule and switch to "hunt_player" mode.
*   **The Engine**: During the world tick, the engine evaluates NPC goals. If an NPC is hunting the player, and the player is in the same `location`, it forcibly pushes a "Combat/Confrontation" storylet to the top of the QBN queue, interrupting whatever the player is doing.

## 4. Immediate Implementation Steps
1.  **Re-write Storylets**: Remove Thorne's immediate arrival. Replace it with an encounter with a low-level Syndicate Enforcer demanding a "Static Tax."
2.  **Expand `socialData.json`**: Convert all NPCs to the `DeepNPC` schema with levels and stats.
3.  **Autonomy Tick**: Update the World Engine so NPCs update their "Goals" dynamically based on the player's world impact.
