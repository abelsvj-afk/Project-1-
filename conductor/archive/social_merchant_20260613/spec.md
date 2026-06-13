# Specification: Core Social & Merchant Interactions

## 1. Overview
This track focuses on solidifying the foundational social and economic loops of Eldoria. We will implement the first set of interactable merchants and formalize the relationship-building mechanics for key NPCs, ensuring the "Universal Social Matrix" is functional and meaningful.

## 2. Functional Requirements
- **Merchant System**: Implement trade logic allowing players to exchange "Shards" for items/salves with specific merchants (Seraphina, Thorne).
- **Social Matrix Integration**: Enable relationship shifts (trust, fear, romance) based on narrative choices and specific interactions.
- **Dynamic Greeting Engine**: NPCs must utilize the fragment engine to offer unique greetings based on their current relationship with the player.

## 3. Acceptance Criteria
- [ ] Players can successfully buy a "Brass Gear-Wand" from Seraphina's stall.
- [ ] Relationship stats (trust/fear/romance) update correctly in the Redux store after social choices.
- [ ] The "Kinship Roster" UI correctly reflects these new relationship axes.

## 4. Out of Scope
- Full companion combat abilities (to be handled in a future combat-focused track).
- Property ownership and real estate income.
