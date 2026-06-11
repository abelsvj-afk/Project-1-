# Spec: The Protagonist & Identity

## Goals
1. **Character Creator:** Build a UI that allows players to set their Name, Pronouns, and physical appearance variables (Body type, hair, eyes, etc.).
2. **Procedural Identity Engine:** Ensure that all chosen visual traits and pronouns are dynamically referenced by NPCs and the narrative engine.
3. **Wardrobe & Inventory:** Implement a visual and systemic inventory. Equipping gear changes your stats AND your text description.
4. **The Skill Tree:** Design the UI and data structure for leveling up Sync, Logic, Prowess, and Finesse.
5. **Isekai Blueprint System:** Implement the foundation for "Modern Inventions" that the player can use to solve world problems.

## Key Deliverables
- `UI:` React components for Character Creation, Inventory, and Skill Tree.
- `State:` Expand Redux `playerSlice` to track appearance, pronouns, and unlocked blueprints.
- `Engine Update:` String interpolation engine for narrative injection.
