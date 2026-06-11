# Endless Narrative Engine Architecture

To move away from linear, hardcoded JSON storylets and create an "endless" systemic RPG with true continuity and cascading effects, we need to upgrade the engine.

## 1. The World State Simulator (The "Conductor")
Instead of just checking if a player meets prerequisites for a static storylet, the engine needs to *generate* storylets based on the current world state.
- **Faction Tension:** The Syndicate, Adepts, and Scavengers have their own goals. If the player helps the Scavengers, Syndicate patrols increase (Menace).
- **Economic Simulation:** Town economies shift based on player actions (e.g., hoarding scrap raises prices).

## 2. Dynamic Storylet Generation (DSG)
Storylets should be composed of mix-and-match components rather than static text blocks.
- **Actor:** Who is involved? (e.g., Kaelen, a Syndicate Guard, a feral Ghoul).
- **Motivation/State:** Why are they here? (Determined by faction tension).
- **Environment:** Where are they? (Determined by player location and time of day).
- *Example:* Instead of a hardcoded "Guard Encounter", the engine looks at `syndicate_menace > 50` and the player's location (`market_district`), then generates an encounter where a Guard tries to extort the player because the local economy is weak.

## 3. The "Ripple" Effect (Cascading Consequences)
Every choice must return multiple, systemic effects:
- Immediate Action (e.g., -10 Wealth, +1 Item).
- Local Reputation (e.g., +5 Scavenger Affinity).
- Global Tension (e.g., +2 Syndicate Menace).
- **World Memory:** We need a `player.history` array that logs major actions. NPCs will check this history before generating dialog.

## 4. NPC Reaction Engine
Integrating the `PresenceMatrix` created earlier.
- If `presence.intimidating > 70`, generated dialogue options for enemies might include "Flee" instead of "Attack."
- If `presence.uncanny > 80`, merchants might refuse service or charge higher prices.

## Implementation Steps
1. **Refactor `storylets.json`** into a `StoryGenerator` class that reads world state and dynamically creates encounters.
2. **Implement Faction Menace/Influence** in Redux.
3. **Create the "Event Deck" system:** A pool of recurring, highly procedural events (Scavenging, Patrols, Anomalies) that pull data from the world state to feel unique every time.
