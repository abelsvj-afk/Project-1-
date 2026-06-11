# Implementation Plan: Politics, Economics & Social Kinship

## Phase 1: Data & State Scaffolding
- [x] Expand `types/game.ts` to include Political, Economic, and Kinship interfaces (Property, Law, Bounty, NPC, Relationship).
- [x] Create `politicalData.json` and `socialData.json`.
- [x] Update `gameSlice.ts` to track owned properties, active laws, bounties, and NPC relationship statuses.

## Phase 2: The Economic & Political Engine
- [x] Build the background "Economic Tick" to calculate passive income, applying upkeep costs and Faction Sanctions.
- [x] Balance the income loops: Ensure Underworld Brokering (Evil/Neutral) is just as lucrative as Civic Governance (Good/Lawful), but with different consequences (Bounties vs. Taxation protests).
- [x] Implement the "Global Event Dispatcher" (action-reaction logic across tiers).

## Phase 3: The Social & Kinship Engine
- [x] Implement the NPC autonomy logic (daily schedules, shifting locations based on `gameTime`).
- [x] Build the Relationship state machine (stranger -> acquaintance -> companion/lover -> spouse -> parent).
- [x] Implement the logic for hiring employees and taming animal companions.

## Phase 4: Dashboards UI
- [x] Build the `CivicDashboard` React component (Town Hall, Real Estate Market).
- [x] Build the `KinshipRoster` React component to view companions, family, and relationships.

## Phase 5: Verification
- [x] Task: Conductor - User Manual Verification 'Politics & Social' (Protocol in workflow.md)
