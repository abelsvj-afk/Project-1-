import { store } from '../src/store';
import { startCombat, endCombat, clearCombat, setGlobalFlag } from '../src/store/slices/gameSlice';
import { setLocation } from '../src/store/slices/playerSlice';
import { dealFromDeck } from '../src/engine/narrativeEngine';
import combatData from '../src/data/combatData.json';
import storyletsData from '../src/data/storylets.json';
import type { EnemyTemplate, Storylet } from '../src/types/game';

const enemies = (combatData as any).enemies as EnemyTemplate[];
const storylets = storyletsData as Storylet[];

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✔ PASS' : '✗ FAIL'} ${msg}`);
  if (!cond) failures++;
};

function findEnemy(id: string) {
  const e = enemies.find(x => x.id === id);
  if (!e) throw new Error(`enemy ${id} missing from combatData`);
  return e;
}

// Helper: simulate a storylet's "fight" choice firing, then a combat result.
function runEncounter(enemyId: string, encounterKey: string, playerWon: boolean) {
  // The fight choice marks the encounter pending and starts combat.
  store.dispatch(setGlobalFlag({ flag: 'pending_encounter', value: encounterKey }));
  store.dispatch(setGlobalFlag({ flag: 'combat_outcome', value: 'pending' }));
  store.dispatch(startCombat(findEnemy(enemyId)));

  // Combat resolves -> endCombat bridges the result into global flags.
  store.dispatch(endCombat({ playerWon }));

  const flags = store.getState().game.globalFlags;
  assert(flags.combat_outcome === (playerWon ? 'victory' : 'defeat'),
    `[${encounterKey}] combat_outcome flag = ${flags.combat_outcome}`);
  assert(flags.combat_last_enemy === enemyId,
    `[${encounterKey}] combat_last_enemy flag = ${flags.combat_last_enemy}`);

  // Player dismisses the result -> combat cleared, narrative re-evaluates.
  store.dispatch(clearCombat());

  const next = dealFromDeck(storylets, store.getState());
  const expected = `aftermath_${encounterKey}_${playerWon ? 'victory' : 'defeat'}`;
  assert(!!next && next.id === expected,
    `[${encounterKey}] aftermath storylet surfaced = ${next?.id} (expected ${expected})`);

  // The aftermath's close choice clears the bridge flags.
  store.dispatch(setGlobalFlag({ flag: 'pending_encounter', value: 'none' }));
  store.dispatch(setGlobalFlag({ flag: 'combat_outcome', value: 'none' }));
  const afterClear = dealFromDeck(storylets, store.getState());
  assert(!afterClear || !afterClear.id.startsWith('aftermath_'),
    `[${encounterKey}] aftermath no longer fires once flags cleared (got ${afterClear?.id})`);
}

async function run() {
  console.log('=== COMBAT → NARRATIVE BRIDGE SIMULATION ===\n');

  // Every triggerCombat reference must point at a real enemy template.
  const triggerIds = storylets
    .flatMap(s => s.choices)
    .map(c => (c.effects as any)?.triggerCombat)
    .filter(Boolean) as string[];
  console.log(`Found ${triggerIds.length} triggerCombat choices: ${triggerIds.join(', ')}\n`);
  for (const id of triggerIds) {
    assert(!!enemies.find(e => e.id === id), `triggerCombat "${id}" resolves to a real enemy`);
  }
  console.log('');

  // Park the player somewhere with no location-gated storylet so only the
  // flag-gated aftermath can win the deck.
  store.dispatch(setLocation('syndicate_territory'));

  runEncounter('syndicate_thug', 'patrol', true);
  console.log('');
  runEncounter('dust_wraith', 'wraith', true);
  console.log('');
  runEncounter('scrap_fiend', 'scrap', false);
  console.log('');
  runEncounter('resonance_stalker', 'stalker', true);

  console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
