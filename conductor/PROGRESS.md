# Eldoria: Master Progress Checklist

This document tracks the implementation of core systems and features as defined in the architectural blueprint.

## 1. Core Engine & Architecture
- [x] React 19 + Redux Toolkit Setup
- [x] TypeScript Data Schemas (Player, Storylet, etc.)
- [x] Centralized State Management (Alignment, Purity, Stats)
- [x] Quality-Based Narrative (QBN) Filtering Engine
- [x] Basic Procedural Text Morphing (Regex-based)
- [x] Vite Build & Deployment Pipeline (Verified)

## 2. Narrative System (QBN)
- [x] Storylet Structure (Prerequisites, Content, Effects)
- [x] Shattered Arrival Storylets (Static Crater)
- [x] **Storylet Continuity & Exhaustion** (Seen tracking)
- [x] **Storylet Priority System** (Weighting)
- [ ] Complex Prerequisites (Chronological, Stat Thresholds)
- [ ] Global Progress Bottlenecks (Clue/Flag tracking)
- [ ] Narrative Archetypes (The Gauntlet, Sorting Hat, etc.)
- [x] **Dynamic Identity Injection**
    - [x] Name/Pronoun parsing in text
    - [x] Appearance/Wardrobe parsing in text

## 3. Morality, Reputation & Politics
- [x] Absolute Alignment Scale (-1000 to 1000)
- [x] Absolute Purity Scale (-1000 to 1000)
- [ ] **Extreme Morphing (Visual/Textual)**
    - [x] Basic text description shifts
    - [ ] UI Color/Typography shifts based on Alignment
    - [ ] **Morphing Tiers** (Ghoul, Adept, Debaser, etc.)
- [x] **Localized Reputation Matrix**
    - [x] State slice for reputation
    - [ ] Subjective worldview modifiers per town/faction
    - [x] Reputation-gated storylets
- [ ] **Tri-Axis Political System**
    - [x] Faction Warfare & Bounties
    - [x] Civic Governance (Mayoral status, Laws, Taxes)
    - [x] Underworld Brokerage (Rigging, Blackmail)

## 4. Systemic Combat (MUD-inspired)
- [x] Action Economy: Balance (Physical)
- [x] Action Economy: Equilibrium (Mental)
- [x] **Affliction & Cure Matrix** (Achaea-inspired)
    - [x] Basic Affliction state tracking
    - [x] Physiological Afflictions (Paralysis, Broken Limbs, Blindness)
    - [x] Psychological Afflictions (Stupidity, Epilepsy, Shivering)
    - [ ] **Advanced Cure Matrix** (Salves, Herbs, Smoke, Ingestion)
- [x] **Curative Item Logic** (Initial Salves/Herbs)

## 5. Economy, Crafting & Property
- [x] Basic Wealth Tracking
- [ ] **Real Estate & Economics**
    - [x] Purchasing Homes/Storefronts/Taverns
    - [x] Maintenance & Upkeep costs
    - [x] Faction Sanctions & Seizures
    - [x] Balanced Lucrative Paths (Good/Evil/Neutral economy loops)
- [ ] **Inventory & Crafting**
    - [x] Dynamic Wardrobe System
    - [ ] Arcane-Industrial Recipe Crafting
    - [ ] **Isekai Blueprints** (Modern concept "Inventions")

## 6. World Simulation, Social & Polish
- [ ] **Global Clock & Weather**
    - [x] Day/Night Cycle
    - [ ] Dynamic Weather (Static Storms, Red Dust)
- [ ] **Social & Kinship System**
    - [x] Companion System (Employees, Friends, Animals)
    - [x] Romance & Family (Multiple relationships, Marriage, Childbirth)
    - [x] Autonomous NPCs (Real personal lives and schedules)
- [x] **Immersive TTS**
    - [x] Speaker-specific voice profiles (Context parsing)
- [ ] **Character Creator**
    - [x] Visual Identity UI
    - [x] Skill Tree (Sync, Logic, Prowess, Finesse)

## 7. Future Expansion & DLC Ready
- [ ] JSON-based content injection system
- [ ] Modding/DLC support documentation
