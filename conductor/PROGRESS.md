# Eldoria: Master Progress Checklist

This document tracks the implementation of core systems and features as defined in the architectural blueprint.

## 1. Core Engine & Architecture
- [x] React 19 + Redux Toolkit Setup
- [x] TypeScript Data Schemas (Player, Storylet, etc.)
- [x] Centralized State Management (Alignment, Purity, Stats)
- [x] Quality-Based Narrative (QBN) Filtering Engine
- [x] Basic Procedural Text Morphing (Regex-based)
- [x] Vite Build & Deployment Pipeline

## 2. Narrative System (QBN)
- [x] Storylet Structure (Prerequisites, Content, Effects)
- [ ] Complex Prerequisites (Chronological, Stat Thresholds)
- [ ] Global Progress Bottlenecks (Clue/Flag tracking)
- [ ] Narrative Archetypes (The Gauntlet, Sorting Hat, etc.)
- [ ] **Dynamic Identity Injection**
    - [ ] Name/Pronoun parsing in text
    - [ ] Appearance/Wardrobe parsing in text

## 3. Morality, Reputation & Politics
- [x] Absolute Alignment Scale (-1000 to 1000)
- [x] Absolute Purity Scale (-1000 to 1000)
- [ ] **Extreme Morphing (Visual/Textual)**
    - [x] Basic text description shifts
    - [ ] UI Color/Typography shifts based on Alignment
    - [ ] Detailed "Ghoul" / "Adept" / "Debaser" morphing tiers
- [ ] **Localized Reputation Matrix**
    - [x] State slice for reputation
    - [ ] Subjective worldview modifiers per town/faction
    - [ ] Reputation-gated storylets
- [ ] **Tri-Axis Political System**
    - [ ] Faction Warfare & Bounties
    - [ ] Civic Governance (Mayoral elections, Laws, Taxes)
    - [ ] Underworld Brokerage (Rigging, Blackmail)

## 4. Systemic Combat (MUD-inspired)
- [x] Action Economy: Balance (Physical)
- [x] Action Economy: Equilibrium (Mental)
- [ ] **Magic Typology (The Four Currents)**
    - [ ] Thermal Entropy (Fire/Ice/Lightning)
    - [ ] Vector Resonance (Earth/Wind/Gravity)
    - [ ] Biomorphic Flux (Nature/Poison/Holy)
    - [ ] Cognitive Distortion (Light/Shadow/Psychic)
    - [ ] Tech Harnesses & Catalysts
- [ ] **Affliction & Cure Matrix**
    - [x] Basic Affliction state tracking
    - [ ] Physiological Afflictions (Paralysis, Broken Limbs, Blindness)
    - [ ] Psychological Afflictions (Stupidity, Epilepsy, Shivering)
    - [ ] Curative Item Logic (Salves, Herbs, Elixirs)

## 5. Economy, Crafting & Property
- [x] Basic Wealth Tracking
- [ ] **Real Estate & Economics**
    - [ ] Purchasing Homes/Storefronts/Taverns
    - [ ] Maintenance & Upkeep costs
    - [ ] Faction Sanctions & Seizures
    - [ ] Balanced Lucrative Paths (Good/Evil/Neutral economy loops)
- [ ] **Inventory & Crafting**
    - [ ] Dynamic Wardrobe System
    - [ ] Arcane-Industrial Recipe Crafting
    - [ ] **Isekai Blueprints** (Modern concept "Inventions")

## 6. World Simulation, Social & Polish
- [ ] **Global Clock & Weather**
    - [ ] Day/Night Cycle
    - [ ] Dynamic Weather (Static Storms, Red Dust)
- [ ] **Social & Kinship System**
    - [ ] Companion System (Employees, Friends, Animals)
    - [ ] Romance & Family (Multiple relationships, Marriage, Childbirth)
    - [ ] Autonomous NPCs (Real personal lives and schedules)
- [ ] **Character Creator**
    - [ ] Visual Identity UI
    - [ ] Skill Tree (Sync, Logic, Prowess, Finesse)

## 8. Machine Learning / AI Generation Hooks (Future)
- [ ] **Procedural Dialogue Generation:** LLM API integration for dynamic NPC responses based on affinity and past choices (replacing static strings).
- [ ] **Dynamic Storylet Injection:** Using ML to generate entirely new "Hub" events based on the player's current presence/reputation matrix.
- [ ] **Sentiment Analysis:** Parsing free-form player text input (if implemented) to automatically adjust alignment/purity without hardcoded buttons.
