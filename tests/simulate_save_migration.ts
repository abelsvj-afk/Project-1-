import { store } from '../src/store';
import { dealFromDeck, assembleProse, narrativeBridge } from '../src/engine/narrativeEngine';
import storyletsData from '../src/data/storylets.json';
import type { Storylet } from '../src/types/game';

const storylets = storyletsData as Storylet[];

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✔ PASS' : '✗ FAIL'} ${msg}`);
  if (!cond) failures++;
};

function run() {
  console.log('=== LEGACY SAVE MIGRATION / CRASH GUARD ===\n');

  // A real, fully-hydrated state (store now backfills defaults).
  const full = store.getState();
  assert(Array.isArray(full.game.openThreads), 'hydrated store has openThreads array');
  assert(!!full.game.contextProfile && typeof full.game.contextProfile === 'object', 'hydrated store has contextProfile');
  assert(Array.isArray(full.game.visitedNodes), 'hydrated store has visitedNodes array');
  console.log('');

  // Reproduce the reported crash: a save written BEFORE these fields existed
  // loads them as undefined. The engine must not throw.
  const legacyGame: any = { ...full.game };
  delete legacyGame.openThreads;
  delete legacyGame.contextProfile;
  delete legacyGame.visitedNodes;
  const legacyState: any = { ...full, game: legacyGame };

  let dealt: Storylet | null = null;
  let threw = false;
  try {
    dealt = dealFromDeck(storylets, legacyState);
    assembleProse(legacyState, 'You stand at the edge of the crater.');
    narrativeBridge(legacyState, storylets[0]);
  } catch (e) {
    threw = true;
    console.log('  threw:', (e as Error).message);
  }

  assert(!threw, 'dealFromDeck / assembleProse / narrativeBridge do not throw on a legacy state');
  assert(dealt !== null, 'deck still returns a valid opening storylet from legacy state');

  console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
