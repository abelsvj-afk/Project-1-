# Eldoria: Code Audit Log

A blunt, evidence-based pass through the codebase (not the design docs — see
`GAMEPLAY_REVIEW.md` for the fidelity-to-plan/fun review). Every item here was
verified by reading the actual source/data, not inferred. Check items off as
they're fixed; add new findings as they surface so this stays the running
record the user asked for ("auto tracked as we progress").

Verified via: `npm install` (207 packages, 0 vulnerabilities), `npm run lint`
(79 errors / 2 warnings), `npx tsc -b --noEmit` (clean, exit 0), plus direct
reads of the files cited below.

## Critical — mechanically inert or actively misleading the player

- [ ] **Equipment upgrades do nothing.** `Status.tsx`'s "Refine" button dispatches
  `upgradeEquipment({ slot, cost: item.level * 100 })`. `upgradeEquipment` in
  `playerSlice.ts` only mutates `item.attributes` on the equipment object
  itself — nothing in `combatEngine.ts` or anywhere else reads
  `equipment[slot].attributes`. The player pays shards and the UI shows no
  before/after change because there isn't one.
- [ ] **Loot silently vanishes above the 20-item inventory cap while still
  reporting success.** `playerSlice.ts` `addItem` (line 101): `if
  (state.inventory.length >= 20) return;` — a silent no-op. But
  `lootEngine.ts` `_triggerLootDrop` dispatches `addItem(...)` and then
  unconditionally sets `last_loot_name`/`last_loot_amount` flags regardless of
  whether the item was actually added. At a full inventory, the player is
  told "You found X" for an item that was discarded.
- [ ] **Rest/heal has dead overwritten code and a redundant double-write.**
  `playerSlice.ts` `restoreResources`: lines `state.stats.vitality =
  state.stats.vitality;` and `state.stats.mentality =
  state.stats.mentality;` are no-ops left in place, followed by the actual
  fix (`Math.max(state.stats.vitality, initialStats.vitality)`, etc.)
  directly below. Functionally harmless but signals the bug was patched
  without removing the broken original lines — and the comment above it
  ("vitality restores to current max, not hardcoded 100") describes behavior
  the dead line directly above it does not implement.
- [ ] **`vitality`/`mentality` conflate "current" and "max."** There is no
  separate current-HP field — `takeDamage`/`consumeMentality` decrement
  `state.stats.vitality`/`state.stats.mentality` directly, the same fields
  used as the stat pool. `gainExperience` only grants `skillPoints += 2` per
  level and never restores or raises these on level-up, and
  `spendSkillPoint` only allows allocating to `vessel`/`logic`/`finesse`/
  `resonance` — there is no way to raise max vitality/mentality at all once
  the game starts.
- [ ] **`world_milestones.json` is fully orphaned.** Zero references to it
  anywhere in `src/` (confirmed via grep). 811 lines of milestone/gate data
  with no engine or component reading it.
- [ ] **`personalityEngine.ts` is dead code.** Zero references anywhere in
  `src/` outside its own file. 53 lines that don't run.
- [ ] **Guardrail middleware never blocks anything.** `GEMINI.md` mandates
  middleware that "actively monitors for and prevents illegal state
  transitions." `store/middleware/guardrails.ts` only calls
  `console.error`/`console.warn`/`Sentry.captureMessage` — and does so
  *after* `next(action)` has already applied the mutation. It's telemetry,
  not a guardrail.
- [ ] **`socialMatrixMiddleware` is a no-op passthrough stub.** Comment in the
  file says cascades were moved into `gameSlice.ts`'s `updateRelationship`,
  but the middleware is still wired into the chain in `store/index.ts` doing
  nothing — dead scaffolding that misleads anyone reading the middleware
  pipeline.

## High — broken player-facing systems

- [ ] **Kaelen's romance arc is unreachable for male players by default.**
  Confirmed an opposite-sex-for-romance prerequisite gates the storylet(s);
  there's no alternate path for a male player to romance Kaelen, despite
  `product.md` pillar 2 ("Universal Social Matrix... build trust, romance,
  or fear with anyone").
- [ ] **`bloodroot_bundle` (sold by Old Man Thorne, `loot_tables.json`,
  `merchant_thorne` table) does not exist in `combatData.json`'s `cures`
  list.** The real cure id is `bloodroot` (singular). A player who buys
  "A large bundle of healing herbs" for 45 shards has bought an item
  `useCure` cannot resolve — it cures nothing.
- [ ] **Four of seven world-map nodes have no location-intro prose at all.**
  `fragments.json`'s `locationIntros` only has entries for `static_crater`,
  `borderlands_outpost`, and `outpost_market`. `dust_flats`,
  `borderlands_warrens`, `iron_watch_hq`, and `adept_spires` — including
  `adept_spires`, a `major_hub` that's home to an entire faction and has an
  NPC scheduled there in `socialData.json` — get no atmospheric scene text.
- [ ] **`adept_spires` has zero storylets.** Of the 28 entries in
  `storylets.json`, none target `adept_spires`. The node exists on the map
  graph, is reachable, and has nothing to do there narratively.
- [ ] **Unbounded NPC accumulation.** `populationEngine.ts` spawns
  procedural NPCs with no cap or cleanup path — `gameSlice.ts`'s `npcs`
  collection only grows.
- [ ] **Archetype mismatch for procedurally generated NPCs** feeds into
  `ARCHETYPE_ASSIST` in `combatEngine.ts`, which expects specific archetype
  keys that generated NPCs don't reliably get assigned, leaving companion
  combat assist silently inert for non-canon companions.
- [ ] **Relationship cascade math rounds small deltas to zero.** Cascading
  relationship effects in `updateRelationship` (`gameSlice.ts`) can compute
  fractional deltas that floor/round to 0, making the cascade a no-op for
  small interactions while still logging that it ran.

## Medium — UX and code-quality issues

- [ ] **CharacterCreator's typewriter effect restarts on every keystroke**
  (`CharacterCreator.tsx`), because the effect re-runs on a dependency that
  changes with each input change rather than once per displayed string.
- [ ] **LoadingScreen's progress bar is fake.** `LoadingScreen.tsx` animates
  a `Math.random()`-driven percentage with no relationship to actual load
  state.
- [ ] **`ttsEngine.ts` has no error handling** around the Web Speech API —
  failures (unsupported browser, no voices loaded) fail silently with no
  fallback or user feedback.
- [ ] **79 ESLint errors / 2 warnings**, including a confirmed
  self-assignment (the `restoreResources` lines above) and a
  React-hook-naming collision on `useCure` (named like a hook but not one,
  tripping `react-hooks` lint rules). `npm run lint` has not been green at
  any point in recent history per the error count.
- [ ] **Pervasive `any` usage** throughout `lootEngine.ts` and elsewhere
  (e.g. `(lootTables.tables as any)[tableName]`, `item: any` in the weighted
  loot loop) despite `conductor/code_styleguides/typescript.md` explicitly
  saying to avoid `any` in favor of `unknown`/specific types.
- [ ] **`fly.toml` sets contradictory VM memory.** Both `memory = '1gb'` and
  `memory_mb = 256` are present in the same `[[vm]]` block — one is silently
  ignored at deploy time, and it's not obvious which.

## Process gap — docs vs. reality

- [ ] **`GEMINI.md`/`workflow.md` claim TDD with >80% coverage; the repo has
  no assertion framework and no `npm test` script.** All correctness
  checking is `console.log`-based simulation scripts under `tests/` (plus
  three at repo root) run manually via `tsx`, read by eye. "Passing" means a
  human confirms the printed values look right.
- [ ] **`conductor/tracks.md` status markers don't reflect what's actually
  implemented.** Tracks 03 (Protagonist), 04 (Magic & Combat), and 05
  (Politics/Economics/Social) are marked `[ ]` (not started) in
  `tracks.md`, yet `CombatConsole.tsx`, `Status.tsx` (equipment/skill
  allocation), `SkillTree.tsx`, `BlueprintLibrary.tsx`, `TradeMenu.tsx`,
  `CivicDashboard.tsx`, and `KinshipRoster.tsx` all exist, are imported in
  `App.tsx`, and are reachable via tabs. The plan-as-source-of-truth
  workflow (`workflow.md` principle 1) has not been kept in sync with
  implementation for at least three tracks.

## How to use this file

When you fix something here, flip its checkbox and note the commit SHA
inline (matching the convention in `tracks/*/plan.md`). When you find a new
issue during regular work, add it under the right severity tier instead of
opening a side conversation about it — this file is the single place these
get tracked.
