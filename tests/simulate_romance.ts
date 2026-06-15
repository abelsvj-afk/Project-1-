import { store } from '../src/store';
import { addCompanion, setSex } from '../src/store/slices/playerSlice';
import { updateRelationship, openThread, setGlobalFlag } from '../src/store/slices/gameSlice';
import { filterStorylets } from '../src/engine/narrativeEngine';
import storyletsData from '../src/data/storylets.json';
import type { Storylet } from '../src/types/game';

const storylets = storyletsData as Storylet[];
let failures = 0;
const assert = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✔ PASS' : '✗ FAIL'} ${msg}`);
  if (!cond) failures++;
};

const eligible = (id: string) => filterStorylets(storylets, store.getState()).some(s => s.id === id);
const romanceOf = () => store.getState().game.relationships['kaelen']?.romance ?? 0;

function run() {
  console.log('=== ROMANCE LADDER SIMULATION (Kaelen, male) ===\n');

  // Opposite-sex player (female) — Kaelen is male — can pursue the romance.
  store.dispatch(setSex('female'));

  assert(!eligible('kaelen_camp_ember'), 'romance beat gated until Kaelen is a companion');
  store.dispatch(addCompanion('kaelen'));
  assert(eligible('kaelen_camp_ember'), 'first camp beat unlocks once Kaelen joins');
  assert(!eligible('kaelen_camp_scars'), 'second beat still gated at romance 0 (needs 18)');
  assert(!eligible('kaelen_confession'), 'confession gated below romance 35');

  store.dispatch(updateRelationship({ npcId: 'kaelen', type: 'romance', change: 40 }));
  console.log('romance after bonding:', romanceOf());
  assert(eligible('kaelen_camp_scars'), 'second beat unlocks past romance 18');
  assert(eligible('kaelen_confession'), 'confession unlocks at romance ≥ 35');

  assert(!eligible('kaelen_proposal'), 'proposal gated without the romance thread open');
  store.dispatch(openThread('romance_kaelen'));
  assert(!eligible('kaelen_proposal'), 'proposal still gated below romance 50 even with thread');
  store.dispatch(updateRelationship({ npcId: 'kaelen', type: 'romance', change: 20 }));
  console.log('romance before proposal:', romanceOf());
  assert(eligible('kaelen_proposal'), 'proposal unlocks with thread open AND romance ≥ 50');

  store.dispatch(setGlobalFlag({ flag: 'married_to', value: 'kaelen' }));
  assert(store.getState().game.globalFlags['married_to'] === 'kaelen', 'marriage records the spouse flag');

  // Orientation gate: a same-sex (male) player cannot romance male Kaelen, even
  // as a companion with maxed romance affinity and the thread open.
  console.log('\n-- orientation gate --');
  store.dispatch(setSex('male'));
  assert(!eligible('kaelen_camp_ember'), 'same-sex pairing: bonding beat gated out');
  assert(!eligible('kaelen_confession'), 'same-sex pairing: confession gated out');
  assert(!eligible('kaelen_proposal'), 'same-sex pairing: proposal gated out');

  console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
