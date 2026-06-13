# Eldoria Project Instructions

## Core Mandates

### 1. Automated Simulations
- **MANDATORY**: Every gameplay mechanic (Combat, Looting, Narrative Engine, NPC Movement, Menu Navigation, etc.) MUST have an automated simulation script created for it.
- **Verification**: Whenever a mechanic is updated or a new one is added, the corresponding simulation MUST be run to verify behavior, check for pitfalls, and ensure pacing/balance.
- **Menu/UI Simulation**: Must include automated tests for all sidebar tabs (Inventory, Skills, Blueprints, Civic, Social) and view transitions (Narrative vs. Combat).
- **Environment**: Simulations should be runnable via `npx tsx` in a headless environment to allow for rapid iteration and stress-testing.

### 2. Emergent Narrative Architecture
- **Non-Static Content**: Avoid large blocks of static, repeatable storylets. 
- **Dynamic Assembly**: Storylets should be treated as "fragments" that are assembled based on:
    - Player History, Presence, and **Detailed Appearance** (Hair, Eyes, Scars, Musculature).
    - Current NPC locations and **Active Companions**.
    - Regional state (Faction control, entropy levels).
- **Spider-Web Connectivity**: Choices must have cascading effects that morph the availability and content of future storylets.

### 3. Companion & NPC Integration
- NPCs must be autonomous actors with their own goals and locations.
- **Companions**: When an NPC joins as a companion, their presence must be reflected in the Fragment Engine and they must provide mechanical/narrative utility in both Narrative and Combat views.

### 4. Pervasive Guardrails & Middleware
- **Universal Protection**: ALL systems, functions, and Redux reducers MUST be protected by guardrails and middleware. This includes retroactively applying them to existing functions that lack them.
- **Engine Diagnostics**: Every exported engine function (Combat, Loot, Presence, Economic, etc.) MUST be wrapped in the `withDiagnostics` utility to trace execution time, arguments, and exceptions.
- **State Invariants**: The Redux `guardrailMiddleware` must actively monitor for and prevent illegal state transitions across all new slices and mechanics.
