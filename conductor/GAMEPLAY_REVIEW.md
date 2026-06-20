# Eldoria: Gameplay & Design-Fidelity Review

Companion to `CODE_AUDIT.md`. That file is about code correctness; this one
is about whether the game is actually *fun*, has real *depth*, and does what
`product.md`, `product-guidelines.md`, `GAME_DESIGN.md`, and `tracks.md`
say it does. Verified against the live content files
(`storylets.json`, `combatData.json`, `world_map.json`, `fragments.json`,
`socialData.json`, `politicalData.json`) and the track plans, not just the
prose docs.

## The core claim vs. the content volume

`product.md` pillar 1 promises "no two playthroughs are exactly alike" via
storylets "assembled dynamically from fragments based on the player's
history, appearance, companions, and the autonomous movement of NPCs."

What's actually in `storylets.json`: **28 storylets total**, distributed
across locations as:

| Location | Storylets |
|---|---|
| `borderlands_outpost` | 4 |
| `static_crater` | 2 |
| `borderlands_warrens` | 2 |
| `outpost_market`, `iron_watch_hq`, `dust_flats` | 1 each |
| `adept_spires` | **0** |
| location-agnostic ("ANY") | 17 |

Two of seven map nodes (`static_crater`, `borderlands_outpost`) account for
6 of the 11 location-specific storylets; `adept_spires` — a `major_hub`,
home to an entire faction (the Adepts), reachable from `iron_watch_hq` — has
**none**. The "emergent" feel the deck-dealing/scoring logic in
`narrativeEngine.ts` is built to produce (continuity bonuses, anti-repeat
penalties, `contextAffinity`) is real machinery, but it's choosing among 28
cards. The fragment-assembly system (`assembleProse`) can vary the *prose*
around a beat, but it can't manufacture beats that don't exist. At 28
storylets, repeat-encounter fatigue is a matter of play sessions, not
hours — the anti-repeat penalty in the scoring function is doing damage
control on a content shortage, not enabling genuine variety.

Compounding this: `fragments.json`'s `locationIntros` — the per-location
atmospheric flavor text that's supposed to make the world feel alive even
between storylets — only covers `static_crater`, `borderlands_outpost`, and
`outpost_market`. Visiting `dust_flats`, `borderlands_warrens`,
`iron_watch_hq`, or `adept_spires` gets you **no scene-setting prose at
all**. Four of seven nodes on the map are functionally blank rooms.

**Verdict:** the *engine* for emergent narrative is more sophisticated than
the *content* it has to work with. This is a content-authoring gap, not an
architecture gap — `narrativeEngine.ts` doesn't need new capabilities to fix
this, `storylets.json` and `fragments.json` need more entries.

## "Tactical Optimizers" pillar vs. actual combat depth

`product.md` pillar 2 targets players who want to "min-max stats and master
the Achaea-inspired combat matrix of balance, equilibrium, and
afflictions." The balance/equilibrium *mechanism* in `combatEngine.ts` is
real and reasonably faithful to the inspiration. But the content feeding it
is thin:

- **4 enemies total** (`dust_wraith`, `scrap_fiend`, `syndicate_thug`,
  `resonance_stalker`), levels 1/2/3/5 — no level-4 enemy, no enemy past
  level 5, meaning there is currently a hard ceiling on combat content.
- **4 spells**, one per "Current" (thermal/vector/biomorphic/cognitive) —
  exactly one option per damage type, so there's no in-Current choice to
  optimize. "Mastering the matrix" currently means memorizing 4 fixed
  spell/affliction pairings, not building a build.
- **10 afflictions / 6 cures**, which is a reasonable matrix on paper, but
  one of the sellable cure items (`bloodroot_bundle`, Thorne's shop) doesn't
  match any real cure id in `combatData.json` (see `CODE_AUDIT.md`) — so in
  practice the affliction/cure economy has a hole a new player can pay real
  currency to fall into.
- Stat progression is capped to four attributes
  (`vessel`/`logic`/`finesse`/`resonance`) via `spendSkillPoint`; vitality
  and mentality — the resources combat actually spends — cannot be
  leveled at all post-character-creation (see `CODE_AUDIT.md`'s
  vitality/mentality finding). A "Tactical Optimizer" min-maxing this game
  hits a wall almost immediately: there's a fixed pool of survivability
  with no lever to pull.
- Equipment "Refine" (the `Status.tsx` upgrade button) doesn't change
  anything mechanically (see `CODE_AUDIT.md`) — so gear progression, the
  most standard min-max lever in this genre, is currently cosmetic plus a
  shard sink.

**Verdict:** the *combat resolution loop* (balance/equilibrium ticking,
affliction application, cure-gating by delivery method) is the most
faithfully implemented system in the game relative to its design doc. The
*progression* wrapped around that loop — gear, stats, spell variety,
bestiary depth — is the part that's missing, and it's the part that turns
"a combat mechanic" into "a tactical game with depth."

## "Universal Social Matrix" pillar vs. actual social depth

`product.md` pillar 2 also promises every NPC, canon or generated, is fully
interactable with trust/romance/fear. `socialData.json` (387 lines of
NPC/schedule data) and `worldSimulationEngine.ts` (schedule-following +
tier-based hunting behavior) back this up structurally — NPCs do move, do
have schedules, and a real relationship state machine exists in
`gameSlice.ts`'s `updateRelationship`. This is one of the stronger
fidelity-to-plan stories in the codebase.

But: Kaelen's romance path is gated by an opposite-sex prerequisite with no
alternate branch (see `CODE_AUDIT.md`), directly contradicting "build...
romance... with anyone" for roughly half of possible players by default.
And the relationship cascade math can round small deltas to zero, so the
"dense, personalized social web" the doc promises is, for low-magnitude
interactions, sometimes not actually updating anything while still
appearing to.

## Politics & Economics: closer to scaffolding than a system

`tracks/track-05-politics-economics/plan.md` Phase 2 calls for a background
"Economic Tick," balanced Underworld-vs-Civic income loops, and a "Global
Event Dispatcher" for cross-tier cascades. None of Phase 2's three items are
checked off, and that matches what's in the code: `economicEngine.ts`
exists (85 lines) and `politicalData.json` has real data (`properties`,
`laws`, 875 lines), and `CivicDashboard.tsx` is built and wired into a tab
in `App.tsx` — but there's no event dispatcher, and `tracks.md` itself
marks this whole track `[ ]` not started, despite the dashboard component
existing and being reachable in the live UI. A player can open the Civic
tab today and see a dashboard for a system whose income/upkeep/sanction
loop isn't implemented yet.

## The plan-vs-reality drift is itself a depth problem

`workflow.md` principle 1 is "The Plan is the Source of Truth." In
practice, `tracks.md` marks Track 03 (Protagonist), Track 04 (Magic &
Combat), and Track 05 (Politics/Economics/Social) as `[ ]` — not
started — while `CombatConsole.tsx`, `Status.tsx`, `SkillTree.tsx`,
`BlueprintLibrary.tsx`, `TradeMenu.tsx`, `CivicDashboard.tsx`, and
`KinshipRoster.tsx` are all built, imported, and tab-reachable in
`App.tsx`. The plan isn't tracking the build, which means nobody can look
at `tracks.md` and learn what's actually playable right now — you have to
read the source. For a project whose own workflow doc says the plan is the
source of truth, that's a process failure with a direct gameplay
consequence: half-built systems (Civic, Blueprints) are exposed to the
player in the UI with no plan-level flag saying "this is a stub."

## Bottom line

The game is not "broken" in the sense of crashing or being unplayable — the
core loop (narrative beat → choice → effects → world tick → next beat,
with combat as a sub-loop) runs end to end. But measured against its own
design docs:

1. **Narrative breadth is the single biggest gap to "fun."** 28 storylets
   and 3-of-7 location intros is not enough content to sustain the
   "emergent, never-the-same" promise past a short session. This is the
   highest-leverage fix — more storylets and location intros directly
   improve perceived depth without any new engine work.
2. **Combat has the right skeleton, no muscle.** Four enemies, four spells,
   inert gear upgrades, and a capped attribute pool mean there's currently
   nothing to "master." This is the second-highest-leverage fix.
3. **Politics/Social are honestly mid-build**, and that's fine — except the
   UI exposes the unfinished parts as if they were finished (a dashboard
   with no underlying loop), which reads as broken to a player even though
   it's really just incomplete per the plan.
4. **The plan itself has drifted from the build**, so prioritization
   decisions (what to build next) are currently being made blind unless
   someone reads the actual source tree first.
