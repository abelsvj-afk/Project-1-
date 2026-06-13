# Eldoria Master Plan: Mobile UI, Progression & Content Expansion

## 1. Goal
Overhaul the UI to be mobile-first (sticky choices, scrolling narrative history), and implement the deep systemic RPG elements from the original blueprint. This includes an Isekai-style leveling/stat progression system, divergent "Tech vs. Natural Magic" skill paths, and progressive storylet content with NPC relationships.

## 2. Key Objectives

### Phase 1: Mobile-First UI & Immersion
- **Scrolling Narrative History:** New storylets and choices append to a scrolling log (like a chat or MUD), rather than replacing the current screen.
- **Sticky Choices UI:** Choice buttons pin to the bottom of the screen on mobile, ensuring action is always accessible without scrolling.
- **Mobile Responsiveness & Polish:** Refactor `App.tsx` and CSS (Tailwind) to stack layouts, collapse sidebars into bottom navigation, and use immersive typography.

### Phase 2: Isekai Progression & The "Tech vs. Magic" Choice
- **Isekai Leveling & Stats:** Implement a core progression system where overcoming hurdles grants experience/levels, allowing the player to increase core stats (Prowess, Logic, Finesse, Sync) over time.
- **The Divergent Path:** The player starts with their singular "Arrival" ability but must choose how to grow. They can choose to learn raw, natural magic OR harness/manipulate magic via Arcane-Industrial technology. The skill tree must reflect this choice.
- **Initial Abilities Constraint:** At the start, the player only has the baseline ability from their arrival. They know nothing and must discover blueprints (tech) or spells (magic).

### Phase 3: Content Expansion & The Unique Awakening
- **The Singular Awakening (Crater):** The opening sequence is unified for all players. After character creation, the protagonist wakes up in the crater. 
- **The "Blessed" Possession/Merge:** The player makes a critical early choice involving an interaction with a strange entity or spirit in the crater. This results in an unexpected merge or possession, granting the player a **Unique Blessed Skill/Affinity**. The player is the *only* entity in the game world with this specific skill, making it highly lore-relevant and tied to their Isekai origin. This establishes their baseline magical nature before they ever decide to pursue Arcane-Tech or natural magic.
- **Progressive Storylets:** Expand `storylets.json` to handle this spirit interaction, the aftermath with the scavenger, and the journey into the Borderlands Outpost, utilizing the Earth-logic inner monologue for tutorialization.
- **NPC Systems:**
  - **Identity Reveal:** Expand the known names system. NPCs start as "strangers" and reveal names organically.
  - **Affinity & Companions:** Implement the UI and logic for making friends, enemies, and recruiting companions.
- **Extreme Morphing:** Ensure textual descriptions morph based on Alignment (Good/Evil) and Purity (Pure/Corrupt), with specific tiers (Ghoul, Adept, Debaser).
- **Combat & Economy (Future Prep):** Lay the groundwork for the MUD-style Affliction/Cure combat matrix and property economics (buying storefronts).

## 3. Implementation Steps

### Step 1: UI Refactor (`App.tsx` & CSS)
- Build a `NarrativeHistory` state array to keep a log of all passed text and selected choices.
- Update `App.tsx` layout to use flexbox with a scrollable narrative area and a fixed bottom container for `activeStorylet.choices`.

### Step 2: Progression & Stats (Redux)
- Update `playerSlice.ts` to handle Experience, Level, and Skill Points.
- Update the `SkillTree` component to visually separate "Raw Magic" and "Magic-Tech" paths.

### Step 3: Content Expansion (`storylets.json`)
- Add sequential storylets for entering the `borderlands_outpost`.
- Introduce new NPCs, name reveal choices, and early Isekai-style stat checks.

### Step 4: Source Control
- Ensure Git is initialized and changes are committed sequentially so the user can verify the progression.

## 4. Consultation & Verification
Present this comprehensive plan to the user for final approval before commencing the UI and progression overhaul.
