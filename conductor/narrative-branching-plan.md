# Eldoria: Narrative Branching & UI Stickiness Plan

## 1. Goal
Fix the disconnected narrative flow so choices have profound, cascading effects on the story. Introduce time-sensitive choices to make the world feel alive. Ensure the UI choice buttons are permanently fixed at the bottom of the screen regardless of scroll position.

## 2. Key Objectives

### Phase 1: The "True Sticky" & Time-Sensitive UI
- **Fixed Button Container:** Refactor `App.tsx` layout so the choices container is absolutely positioned or part of a rigid flex-column structure, ensuring it NEVER scrolls away.
- **Time-Sensitive Logic:** Introduce a `timeLimit` property to the `Storylet` interface.
- **Countdown Timer:** Add a visual progress bar (timer) to the choice UI. If the timer hits zero, the engine automatically selects a fallback choice (usually a negative outcome or a missed opportunity).

### Phase 2: Cascading Narrative Continuity & Systemic Looting
- **Affinity-Based Branching:** The choice of "Blessed Ability" (Thermal, Vector, etc.) must flavor subsequent storylets. We'll use the `affinity` global flag.
- **Scavenger Consequences:** The interaction with Kaelen (`path: resonance`, `path: distortion`, `path: void`) radically alters the Outpost Arrival.
- **Systemic Text-Based Looting:** In a text RPG, looting isn't clicking a glowing chest; it's a narrative choice. We must implement "Scavenge" or "Loot" actions as choices within storylets. 
    - These choices will utilize the `addItem` effect.
    - Example: Instead of just arriving at the Outpost, you can choose to "Scavenge the rusted plating near the gate," yielding `scrap_metal` or `frayed_wire` into your inventory.
- **Skill Tree Hooks:** Storylets will feature choices gated by or testing your `stats` (Prowess, Logic, Finesse, Sync). 
    - Example: Ripping a copper pipe out of a wall requires Prowess > 12. Using your Modern Logic to decipher a broken console requires Logic > 12.

## 3. Implementation Steps

### Step 1: Interface Updates (`types/game.ts`)
- Add `timeLimit?: number` (in seconds) to the `Storylet` interface.
- Add `defaultChoiceId?: string` to handle timeouts.
- Ensure `requiredStats` in `StoryletPrerequisites` is fully utilized for skill-gated choices.

### Step 2: UI Overhaul (`App.tsx`)
- Implement the `useEffect` timer logic for time-sensitive storylets.
- Refactor the CSS layout so the Narrative History is `flex-1 overflow-y-auto` and the Choices Container is a fixed block underneath it, guaranteeing it stays on screen.
- Improve the visual display of choice requirements (e.g., showing "[Requires Logic 15]" next to a choice).

### Phase 3: Content Rewriting (`storylets.json`)
- Delete the generic `outpost_arrival`.
- Create divergent Outpost arrival storylets (`outpost_arrival_kaelen`, `outpost_arrival_alone_hostile`).
- Integrate **Looting Opportunities**: Add choices that allow the player to scavenge for initial crafting materials (`iron_scrap`, `glass_shard`, `resonance_dust`) on their way to the Outpost.
- Integrate **Skill Checks**: Add a choice that tests the player's new "Blessed Skill" or their core stats to bypass an obstacle.
- Make the Scavenger encounter (`crater_wake`) time-sensitive (e.g., 15 seconds to answer him).

### Phase 4: The Endless Loop Architecture
To prevent the game from "ending" at the market, we must build a systemic engine loop.
- **Procedural "Deck" of Storylets:** Instead of a linear sequence, the Outpost will have a "deck" of repeatable world events (e.g., "A Syndicate Patrol Passes", "A Scavenger Offers a Trade", "A Strange Aetherial Storm Brews").
- **The Core RPG Loop:** The player enters the "Market Hub" where they are not forced into a story but presented with systemic options: 
    1. **Rest/Heal** (Spend Wealth)
    2. **Scavenge the Wastes** (Triggers randomized, repeatable encounter storylets yielding XP/Loot)
    3. **Seek Bounties/Work** (Triggers combat or logic puzzle storylets)
    4. **Socialize** (Triggers NPC affinity storylets)
- **Progression Hurdles:** Major plot storylets only appear in the deck when the player reaches specific thresholds (e.g., Level 5, Wealth > 1000, "scavenger" reputation > 50). This guarantees near-infinite playtime between major narrative beats.

## 4. Consultation
This plan addresses the "disconnected" feeling by making the Outpost arrival entirely dependent on the crater choices, while also adding the requested time-pressure mechanic. The Endless Loop architecture guarantees the game opens up into a systemic RPG rather than hitting a dead end.
