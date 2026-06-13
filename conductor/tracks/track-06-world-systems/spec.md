# Specification: World Systems & NPC Autonomy

## 1. NPC Schedule Engine
- NPCs follow 24-hour cycles defined in `socialData.json`.
- Actions: `rest`, `work`, `patrol`, `trade`.
- Locations are updated in real-time within the Redux `game.npcs` state.

## 2. Economic Simulation
- Local wealth and supply/demand modifiers based on player transactions.
- Property income generation for `ownedProperties`.

## 3. Faction AI
- Menace tracking: High menace triggers Iron Watch patrols in the current location.
- Warfare: Factions can shift control of `borderlands` locations based on player choices or time-based events.
