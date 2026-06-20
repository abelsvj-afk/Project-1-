# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Eldoria** — a systemic, text-based RPG. A single-player React app with no backend logic: all game state, simulation, and "AI" lives client-side in Redux; `server.js` only serves the built static bundle. See `conductor/product.md` for the narrative/design vision and `GEMINI.md` for binding project mandates (below).

## Commands

```bash
npm install        # install deps
npm run dev         # Vite dev server
npm run build        # tsc -b && vite build (type-check then bundle)
npm run lint         # eslint .
npm run preview       # preview a production build
npm start           # node server.js — serves dist/, expects a prior build
```

There is no test runner configured in `package.json` (no `npm test`). Tests are headless simulation scripts under `tests/` (plus three at repo root: `simulate_lifecycle.ts`, `simulate_loot.ts`, `simulate_progression.ts`), run individually with `tsx`:

```bash
npx tsx tests/simulate_combat.ts
npx tsx tests/test_deck_logic.ts
npx tsx simulate_loot.ts
```

Each script imports the real `store` from `src/store`, dispatches actions, and prints `console.log` assertions/state dumps — there's no assertion framework, so "passing" means reading the output and confirming the logged values/transitions are correct. There are two naming families: `simulate_*.ts` (scenario walkthroughs for a whole mechanic) and `test_*.ts` (narrower checks, e.g. deck/scene logic). When adding or changing a gameplay mechanic, add or update the corresponding script and run it — this is enforced by `GEMINI.md`, not by CI.

## Architecture

### Layered structure
- `src/types/game.ts` — the single source of truth for shared shapes (`Player`, `Storylet`, `Choice`, `Equipment`, `EnemyTemplate`, combat types, etc.). Read this first when touching state shape.
- `src/data/*.json` — static content: `storylets.json` (narrative beats), `fragments.json` (prose fragments assembled at runtime), `combatData.json` (spells/cures/afflictions/enemies), `world_map.json` (location graph), `loot_tables.json`, `socialData.json`, `politicalData.json`, `personalities.json`, `world_milestones.json`.
- `src/store/` — Redux Toolkit. Two slices: `playerSlice` (the character — stats, inventory, appearance, combat resources) and `gameSlice` (the world — NPCs, storylet/flag state, active combat, narrative history, map). `store/index.ts` wires four custom middleware in order: `loggerMiddleware`, `guardrailMiddleware`, `socialMatrixMiddleware` (currently a no-op passthrough — cascades were moved into `updateRelationship` in `gameSlice.ts`), `persistenceMiddleware`. State is debounced-saved to `localStorage` and rehydrated by merging saved state *over* fresh default state (`store/index.ts`), so a save from before a field existed never produces `undefined` — never replace state wholesale on load.
- `src/engine/` — pure-ish logic that reads `RootState` and dispatches actions; this is where game rules actually live (not in components). Notable engines:
  - `narrativeEngine.ts` — the storylet deck: `filterStorylets` (prerequisite gating + dynamic scoring), `dealFromDeck` (weighted pick, respects `forcedStoryletId` for guaranteed follow-ups), `assembleProse` (stitches location/companion/NPC/faction/context fragments onto base content, seeded-deterministic per game-state snapshot so re-renders don't reroll text), `narrativeBridge` (cause→effect transition text), `interpolate`/`morphText` (template tags like `{player.name}`, `{npc:id}`, `[NPC_REACT]`, alignment/purity-driven text morphing).
  - `combatEngine.ts` — Achaea-style balance/equilibrium combat: `processCombatTick` (100ms tick: afflictions, enemy AI, companion assists, win/loss check), `castSpell`, `useCure`. Companion combat behavior is driven by NPC `personality.archetype` (`ARCHETYPE_ASSIST` map).
  - `worldSimulationEngine.ts` — autonomous NPC movement (schedule-following + hierarchy-tier overrides, e.g. tier-3+ "elites" hunt the player on high menace/wealth). Called once per player choice via `simulateWorldTurn`, not on a timer.
  - `presenceEngine.ts` — derives a `PresenceMatrix` (uncanny/intimidating/exotic/normalized) from `Appearance`, feeding NPC reactions.
  - `populationEngine.ts`, `historyEngine.ts`, `economicEngine.ts`, `lootEngine.ts`, `personalityEngine.ts`, `ttsEngine.ts` — generic NPC spawning, narrative-history consolidation, merchant/economy, loot rolls, NPC personality generation, browser TTS wrapper respectively.
  - `engine/utils/diagnostics.ts` — `withDiagnostics(fn, name)` wraps a function with timing/arg/result logging and Sentry exception capture.
- `src/hooks/` — `useWorldEngine` (ticks the world simulation/combat loop from React) and `useCombat`.
- `src/components/` — presentational React components for each sidebar tab (`Inventory`, `SkillTree`, `BlueprintLibrary`, `CivicDashboard`, `KinshipRoster`, `WorldMap`, `Status`, `TradeMenu`) plus `CombatConsole` and `CharacterCreator`.
- `src/App.tsx` — the orchestrator: owns the narrative/combat view toggle, drives the storylet deck (`dealFromDeck` → `morphText`/`assembleProse` → push to `narrativeHistory`), applies `Choice.effects` (stat/flag/relationship/companion/combat-trigger changes) in `handleChoice`, and ticks `simulateWorldTurn` after every choice.

### Engine function convention
Almost every exported engine function follows this pattern: an internal `_implementationName` (snake-prefixed, despite the Google TS style guide in `conductor/code_styleguides/typescript.md` saying not to use `_` — the codebase convention overrides the style doc here) wrapped and exported as `export const implementationName = withDiagnostics(_implementationName, 'implementationName')`. Follow this pattern for new engine functions — it's how Sentry/console diagnostics get applied uniformly (the "Pervasive Guardrails & Middleware" mandate in `GEMINI.md`).

### Storylet/effect data flow
1. `App.tsx`'s storylet effect calls `dealFromDeck(storyletsData, state)`, which filters `storylets.json` entries by `prerequisites` (location, flags, relationships, alignment/purity/wealth thresholds, items, threads, companion presence, opposite-sex-for-romance, etc.) then scores survivors (continuity bonuses for `lastChoiceId`/`lastStoryletId`/open threads, anti-repeat penalty, `contextAffinity` from the hidden `contextProfile`).
2. The winning storylet's `content` is run through `morphText` → `assembleProse`, pushed into `game.narrativeHistory`, and optionally read aloud via `ttsEngine`.
3. Player picks a `Choice`; `handleChoice` in `App.tsx` dispatches every populated field of `Choice.effects` (there are ~15 possible effect kinds — stat/flag/item/relationship/companion/thread/combat-trigger) and reinforces `contextProfile` from the choice's `tags`.
4. `simulateWorldTurn` runs once, moving NPCs and possibly triggering ambient events, before the deck is re-evaluated.

### Combat
Combat uses Achaea-style balance (physical cooldown) and equilibrium (mental cooldown), both in ms, capped and ticked down by `processCombatTick` on a 100ms interval invoked from `useCombat`/`useWorldEngine`. Cures are gated by delivery method (`topical`/`smoke` cost balance, others cost equilibrium); spells are gated by the relevant cooldown plus mentality cost, and their damage scales off the stat tied to their `current` (thermal→vessel, vector→logic, cognitive→finesse, biomorphic→resonance).

## Conventions worth knowing
- No default exports for engine/store modules; components use default exports (existing pattern, follow it).
- Defensive `?? []` / `?? {}` defaults are used throughout `narrativeEngine.ts`/reducers specifically to keep legacy `localStorage` saves from crashing the engine when a field didn't exist yet — don't remove these without confirming the save-migration story (`tests/simulate_save_migration.ts`) still passes.
- Tailwind is used inline in JSX (no separate component CSS beyond `App.css`/`index.css`); theme colors come from CSS vars set via `document.body.setAttribute('data-theme', ...)` based on alignment/purity (see end of `App.tsx`).
- Sentry (`@sentry/react`, `@sentry/node`) is wired at the app root (`Sentry.withErrorBoundary` in `App.tsx`) and inside `withDiagnostics` — exceptions thrown from engine functions are auto-reported.

## Project mandates (`GEMINI.md`)
These are binding project rules, not suggestions:
1. **Automated simulations are mandatory.** Every gameplay mechanic must have a `tsx`-runnable simulation script under `tests/`, and it must be (re-)run whenever that mechanic changes.
2. **Emergent narrative only.** Avoid static repeatable storylet blocks; storylets are fragments assembled from player history/appearance/companions/NPC location/regional state, with cascading choice effects.
3. **NPCs are autonomous and universal.** Every NPC — canon or procedurally generated — must be fully interactable with life/death and trust/romance/fear relationship state; companions must provide real mechanical utility in both narrative and combat.
4. **Pervasive guardrails.** All engine functions and Redux reducers must be protected (`withDiagnostics`, `guardrailMiddleware` state-invariant checks), including retrofitting older code that lacks this.

## Conductor docs
`conductor/` holds the project's design and process documentation: `product.md`/`product-guidelines.md` (vision, audience, tone), `tech-stack.md`, `workflow.md` (TDD task lifecycle, commit conventions — note much of it is generic template text, not all literally followed in this repo's git history), `tracks.md` + `tracks/*/plan.md` (phase/task tracking — this is the closest thing to a project plan/backlog), and `code_styleguides/` (style references; see the engine-function convention note above for where the codebase diverges from the documented TS style guide).
