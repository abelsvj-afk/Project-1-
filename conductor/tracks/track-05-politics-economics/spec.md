# Spec: Politics, Economics & Social Kinship

## Goals
1. **Tri-Axis Power State:** Track Faction Warfare (Menace/Bounties), Civic Governance (Mayoral status, Laws), and Underworld Brokerage (Blackmail, Rigging).
2. **Balanced Economy:** Ensure all playstyles (Good/Evil/Neutral) are highly lucrative. Real estate provides passive income, but comes with upkeep, faction sanctions, and dynamic market events. Actions have clear economic and political reactions.
3. **Social & Kinship System:** 
    - **Companions:** Hire employees, tame animals, or form friendships. Companions have unique stats and personalities.
    - **Romance & Family:** Support multiple relationship types (polyamory/monogamy), marriage, and childbirth. Families age and react to the player's alignment.
4. **Autonomous NPCs:** NPCs are not static. They have daily schedules, personal lives, and relationships of their own that the player can disrupt or aid.
5. **UI Dashboards:** A `CivicDashboard` for politics/real estate, and a `KinshipRoster` for managing relationships and companions.

## Key Deliverables
- `Data:` `politicalData.json` and `socialData.json` (NPC schedules, relationship thresholds).
- `State:` Update `gameSlice.ts` for `politics` (laws, bounties), `economy` (properties, balanced income loops), and `kinship` (relationships, family members).
- `Engine:` Expand `economicEngine.ts` to process income, upkeep, and NPC daily schedule shifts.
- `UI:` `CivicDashboard` and `KinshipRoster` components.
