# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## Project Overview

**Eldoria** is a systemic, text-based RPG ("Quality-Based Narrative" / QBN
style) built as a React + Redux single-page app. The world is "Magic-Tech":
magic is a resource exploited through technology, and the game blends deep
narrative emergence (storylets assembled from fragments based on player
history, appearance, companions, and NPC autonomy) with Achaea-inspired
tactical combat (balance/equilibrium action economy, afflictions, cures).

There is no backend/database — all game state lives in Redux and is persisted
to `localStorage`. `server.js` only serves the static Vite build.

Read these first for product/narrative context:
- `GEMINI.md` — core architectural mandates (simulations, fragment-based
  narrative, NPC autonomy, guardrails/diagnostics). Treat these as binding.
- `GAME_DESIGN.md` — narrative/world-building discovery notes.
- `conductor/` — the project's planning system (see "Conductor Docs" below).

## Tech Stack

- **Language**: TypeScript (strict-ish — `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch` all on)
- **Framework**: React 19
- **Build Tool**: Vite (`vite.config.ts`, target `es2020`)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` + CSS custom properties
  for theming (`src/index.css`)
- **State**: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Observability**: Sentry (`@sentry/react` in the browser, `@sentry/node`
  in `server.js` / `instrument.js`)
- **Runtime/Deploy**: Node 20 (Docker), deployed to Fly.io (`fly.toml`)
- **Simulation/testing**: headless `.ts` scripts run with `npx tsx` (no
  Jest/Vitest configured)

## Repository Structure

```
src/
  App.tsx                 # Main app shell: layout, view switching, choice handling
  main.tsx                # Entry point, Sentry init, global click diagnostics
  index.css               # Tailwind import + theme CSS variables (data-theme)
  types/game.ts            # Central type definitions for the entire game state
  store/
    index.ts              # configureStore, middleware chain, save-state hydration
    persistence.ts         # localStorage save/load (debounced, skips mid-combat)
    slices/
      playerSlice.ts       # Player stats, inventory, equipment, alignment/purity
      gameSlice.ts          # World state: NPCs, combat, narrative history, factions
    middleware/
      logger.ts             # Dev console logging + Sentry breadcrumbs
      guardrails.ts          # Runtime invariant checks (negative wealth, etc.)
      socialMatrix.ts        # No-op passthrough (cascades live in gameSlice reducers)
  engine/                  # Pure-ish logic layer, decoupled from React
    narrativeEngine.ts     # Storylet filtering/scoring, deck dealing, text morphing
    combatEngine.ts        # Combat tick, spells, cures, enemy AI, companion assists
    economicEngine.ts       # Employment, passive income, property ticks
    historyEngine.ts        # Narrative history consolidation (context window control)
    lootEngine.ts           # Procedural loot table rolls
    personalityEngine.ts    # Deterministic NPC personality generation
    populationEngine.ts     # Procedural generic-NPC generation on location entry
    presenceEngine.ts       # Appearance -> "presence" matrix (uncanny/intimidating/etc.)
    worldSimulationEngine.ts # Autonomous NPC movement/world ticks
    ttsEngine.ts             # Web Speech API wrapper for narration
    utils/diagnostics.ts    # withDiagnostics() wrapper (see Conventions)
  hooks/
    useWorldEngine.ts       # 5s interval -> processEconomicTick
    useCombat.ts            # 100ms interval -> processCombatTick (when combat active)
  components/              # UI: CharacterCreator, Inventory, SkillTree, CombatConsole,
                            # WorldMap, CivicDashboard, KinshipRoster, Status, etc.
  data/                    # Game content as JSON (see "Data-Driven Content")
tests/                     # Headless simulation scripts (npx tsx tests/<name>.ts)
simulate_*.ts              # Root-level lifecycle/loot/progression simulations
conductor/                 # Project planning docs, tracks, style guides (see below)
server.js, instrument.js   # Production static file server + Sentry (Node)
```

## Development Commands

```bash
npm install        # install dependencies
npm run dev         # start Vite dev server (hot reload)
npm run build       # tsc -b (project references) + vite build -> dist/
npm run preview     # preview the production build locally
npm run lint        # ESLint over the whole repo
npm start            # node server.js (serves dist/ — run build first)
```

There is **no `npm test`**. Verification is done via headless simulation
scripts:

```bash
npx tsx tests/simulate_combat.ts
npx tsx tests/simulate_world.ts
npx tsx simulate_lifecycle.ts
```

These import `src/store` directly, dispatch actions, and assert/log expected
behavior (see `tests/` and the root `simulate_*.ts` files for the pattern).
**Per `GEMINI.md`, every gameplay mechanic must have a corresponding
simulation, and it must be (re)run whenever that mechanic changes.**

## Architecture

### Redux store (`src/store`)
Two slices: `player` (the PC — stats, inventory, equipment, alignment/purity,
afflictions, companions) and `game` (the world — NPCs, factions, combat,
narrative history, threads, context profile, economy).

Middleware chain (in order): `loggerMiddleware` -> `guardrailMiddleware` ->
`socialMatrixMiddleware` (no-op, kept for chain stability) ->
`persistenceMiddleware`.

State is hydrated from `localStorage` (`eldoria_v1_save`) by **merging** saved
state over fresh `initialState` (`store/index.ts`), so new fields added to a
slice always have defaults even for old saves. When adding new top-level
slice fields, don't assume a saved game already has them.

### Engine layer (`src/engine`)
Pure functions that take `(state: RootState, dispatch: AppDispatch, ...)` and
dispatch Redux actions — they don't read/write React state directly. `App.tsx`
and the hooks (`useWorldEngine`, `useCombat`) call into these on ticks or
player actions.

**Every exported engine function must be wrapped with `withDiagnostics`**
(`src/engine/utils/diagnostics.ts`). Convention: write the real implementation
as `_camelCaseName`, then `export const camelCaseName = withDiagnostics(_camelCaseName, 'camelCaseName')`.
This logs timing/args/exceptions to console + Sentry. Follow this pattern for
any new engine export.

### Narrative system (QBN)
- `src/data/storylets.json` — static storylet definitions with
  `prerequisites`, `choices`, `effects`, optional `tags`.
- `src/data/fragments.json` — prose fragments (location intros, companion/NPC
  reactions, faction/context overlays) stitched together by
  `assembleProse()`.
- `narrativeEngine.ts`:
  - `filterStorylets` / `dealFromDeck` — gate by prerequisites (location,
    alignment/purity ranges, items, flags, relationships, threads, etc.),
    then score and weight-pick among near-top candidates.
  - **Context Profile** (`game.contextProfile`): a decaying per-tag weight map
    built from `choice.tags`. `contextAffinity()` boosts storylets whose tags
    resonate with — or dramatically oppose (`TAG_OPPOSITES`) — the player's
    accumulated leanings. This is the "spider-web" continuity system.
  - `morphText` / `interpolate` — template substitution (`{player.name}`,
    `{npc:id}`, etc.) and alignment/purity-based prose morphing. Any new
    directive tag like `[SOME_TAG]` **must** be explicitly handled, or it will
    be silently stripped by the safety-net regex at the end of `morphText`.
  - `narrativeBridge` — prepends a transition sentence when the next storylet
    is a direct consequence of the last choice/thread (cause -> effect framing).
  - **Open Threads** (`game.openThreads`): multi-beat arcs gated via
    `requiresThread` / advanced via `effects.openThread` / `resolveThread`.

### Combat system
Achaea-style action economy: `balance` (physical cooldown) and `equilibrium`
(mental cooldown), both in ms, tick down via `useCombat` (100ms interval ->
`processCombatTick`). Spells (`combatData.json`) scale damage off the relevant
`PlayerStats` "current" (thermal->vessel, vector->logic, cognitive->finesse,
biomorphic->resonance). Afflictions tick every 10 rounds. Companions get
periodic "assists" based on their NPC `personality.archetype`
(`ARCHETYPE_ASSIST` map in `combatEngine.ts`).

### World simulation & NPC autonomy
- `game.npcs` is the single source of truth for all NPCs (canon + procedurally
  generated). `populationEngine.ts` generates generic NPCs on location entry;
  `worldSimulationEngine.ts` moves NPCs across `world_map.json` nodes on each
  player turn (`simulateWorldTurn`, called from `App.tsx`'s `handleChoice`).
- `economicEngine.ts` (5s interval via `useWorldEngine`) handles passive
  employee income, property upkeep, etc.
- Relationships (`trust`/`romance`/`fear`) live in `game.relationships`, with
  cascades (fear lowers trust, romance boosts trust) handled **inline inside
  the `updateRelationship` reducer** in `gameSlice.ts` — not in middleware.

### Data-driven content (`src/data/*.json`)
`storylets.json`, `fragments.json`, `combatData.json` (spells/afflictions/
cures/enemies), `loot_tables.json`, `socialData.json` (NPC roster),
`politicalData.json`, `world_map.json`, `world_milestones.json`,
`personalities.json`. Prefer adding/editing JSON content over hardcoding
strings in engine/components.

### Theming
`App.tsx` sets `document.body.setAttribute('data-theme', ...)` based on
alignment/purity (`default` / `adept` / `debaser` / `corrupted`). Theme colors
are CSS variables defined per `[data-theme]` block in `src/index.css`
(`--bg-primary`, `--accent-color`, etc.) — use these variables rather than
hardcoded Tailwind colors for anything that should shift with theme.

## Key Conventions

- **Guardrails**: `guardrailMiddleware` (`src/store/middleware/guardrails.ts`)
  checks invariants after every action (no negative wealth, alignment/purity
  within ±1000, valid NPC location nodes, non-negative game time). When adding
  new state with bounds/invariants, add a corresponding check here — per
  `GEMINI.md` this should be applied "universally," including retroactively.
- **withDiagnostics everywhere**: see Engine layer above — applies to every
  exported engine function, not just new ones.
- **Types are centralized** in `src/types/game.ts`. Extend `GameState`,
  `Player`, `Storylet`/`StoryletPrerequisites`/`StoryletEffects`, etc. there
  rather than inlining ad-hoc shapes.
- **Action effects pipeline**: `StoryletEffects` in `types/game.ts` defines
  every possible side effect a choice can have (`addItem`, `triggerCombat`,
  `recruitCompanion`, `relationshipChanges`, `openThread`, ...). `App.tsx`'s
  `handleChoice` is the single dispatcher that maps each effect field to a
  Redux action — when adding a new effect type, update both the type and this
  dispatcher.
- **Reducers stay capped/bounded** (e.g. `Math.max(-1000, Math.min(1000, ...))`
  for alignment/purity, inventory capped at 20, relationship axes clamped to
  their ranges). Follow this pattern for new numeric state.
- **Code style**: This project nominally follows the Google
  TS/JS/HTML+CSS style guides summarized in `conductor/code_styleguides/`
  (named exports preferred, `const`/`let` only, single quotes, strict
  equality, avoid `any`). In practice the codebase uses `any` in several spots
  for JSON-imported data (`as any`) — match existing style in a given file,
  but avoid introducing *new* `any` where a real type from `types/game.ts`
  exists.
- **ESLint** (`eslint.config.js`): `@eslint/js` recommended +
  `typescript-eslint` recommended + `eslint-plugin-react-hooks` +
  `eslint-plugin-react-refresh` (Vite). Run `npm run lint` before considering
  a change done.
- **TypeScript project references**: `tsconfig.app.json` (src/, ES2020+DOM)
  and `tsconfig.node.json` (vite.config.ts, ES2023). `npm run build` runs
  `tsc -b` across both — unused locals/params are build errors.

## Conductor Docs (`conductor/`)

This repo uses a "Conductor" planning methodology:
- `conductor/index.md` — index of product/workflow/tracks docs.
- `conductor/workflow.md` — the full TDD task lifecycle (mark task in-progress
  in `plan.md`, write failing tests first, implement, verify coverage, commit,
  attach a `git notes` summary, update `plan.md` with the commit SHA). This is
  fairly heavyweight CI/agent process documentation — useful context but **use
  judgment**: for small/ad-hoc changes requested directly by a user in this
  session, follow the spirit (tests where it makes sense, clear commits)
  rather than the full ceremony (git notes, phase checkpoints) unless asked.
- `conductor/tracks.md` + `conductor/tracks/*` — major feature tracks and
  their plans/specs. `conductor/PROGRESS.md` is the master checklist of what's
  implemented vs. planned across the whole game.
- `conductor/product.md`, `product-guidelines.md`, `tech-stack.md` — product
  vision, UX philosophy (sticky choices bar, narrative/combat separation,
  contextual gating), and the authoritative tech stack description. **If you
  change the tech stack, update `tech-stack.md` first per the documented
  workflow.**
- `conductor/pitfall-analysis.md`, `npc-autonomy-and-pacing.md`,
  `emergent-systems-pivot.md` — design rationale for the fragment/QBN engine,
  NPC tiering (Grunt -> Specialist -> Lieutenant -> Apex), and known gaps
  (magic typology, political tri-axis system, isekai blueprints, etc.).

## Deployment

- `Dockerfile`: multi-stage build (Node 20-slim) — `npm install` + `npm run
  build` in the builder stage, then copies `dist/`, `node_modules`,
  `server.js`, `instrument.js` into the runtime image. `CMD ["node",
  "server.js"]`, exposes port 8080.
- `fly.toml`: Fly.io app `newworld`, region `ams`, scales to zero
  (`min_machines_running = 0`).
- `server.js` is a minimal static file server with SPA fallback to
  `index.html` (404s for missing `/assets/*`).
- Sentry DSNs are hardcoded in `instrument.js` and `src/main.tsx` (frontend +
  Node). `test-sentry.js` is a manual Sentry verification script.

## Notes / Known Quirks

- `src/components/TradeMenu.tsx` exists but is not currently imported/used
  anywhere (no merchant UI is wired into `App.tsx` yet) — check before
  assuming it's reachable.
- `Text-Based RPG.txt` at the repo root is a large prose/design dump — useful
  for lore context but not source code.
- The footer in `App.tsx` includes a "[ Sentry Test ]" button that intentionally
  throws, for verifying error reporting — don't treat it as a bug.
