# Implementation Plan: Politics, Economics & Social Kinship

## Phase 1: Data & State Scaffolding
- [ ] Expand `types/game.ts` to include Political, Economic, and Kinship interfaces (Property, Law, Bounty, NPC, Relationship).
- [ ] Create `politicalData.json` and `socialData.json`.
- [ ] Update `gameSlice.ts` to track owned properties, active laws, bounties, and NPC relationship statuses.

## Phase 2: The Economic & Political Engine
- [ ] Build the background "Economic Tick" to calculate passive income, applying upkeep costs and Faction Sanctions.
- [ ] Balance the income loops: Ensure Underworld Brokering (Evil/Neutral) is just as lucrative as Civic Governance (Good/Lawful), but with different consequences (Bounties vs. Taxation protests).
- [ ] Implement the "Global Event Dispatcher" (action-reaction logic across tiers).

## Phase 3: The Social & Kinship Engine
- [ ] Implement the NPC autonomy logic (daily schedules, shifting locations based on `gameTime`).
- [ ] Build the Relationship state machine (stranger -> acquaintance -> companion/lover -> spouse -> parent).
- [ ] Implement the logic for hiring employees and taming animal companions.

## Phase 4: Dashboards UI
- [ ] Build the `CivicDashboard` React component (Town Hall, Real Estate Market).
- [ ] Build the `KinshipRoster` React component to view companions, family, and relationships.

## Phase 5: Verification
- [ ] Task: Conductor - User Manual Verification 'Politics & Social' (Protocol in workflow.md)
