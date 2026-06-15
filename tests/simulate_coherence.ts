import { store } from '../src/store';
import { setLocation, setBlessedAbility } from '../src/store/slices/playerSlice';
import {
  setGlobalFlag, setLastChoiceId, markStoryletSeen, revealKnowledge, openThread,
} from '../src/store/slices/gameSlice';
import { dealFromDeck, narrativeBridge, morphText } from '../src/engine/narrativeEngine';
import storyletsData from '../src/data/storylets.json';
import type { Storylet } from '../src/types/game';

const storylets = storyletsData as Storylet[];
const byId = (id: string) => storylets.find(s => s.id === id)!;

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✔ PASS' : '✗ FAIL'} ${msg}`);
  if (!cond) failures++;
};

const next = () => dealFromDeck(storylets, store.getState());

function run() {
  console.log('=== NARRATIVE COHERENCE WALK (opening sequence) ===\n');

  // --- Text pipeline: no raw directive tags survive ---
  const RAW = /\[(INNER_MONOLOGUE|NPC_REACT|SCAVENGER_REACT|[A-Z][A-Z0-9_]+)\]/;
  for (const id of ['awakening_void', 'crater_wake', 'outpost_arrival_kaelen_trust']) {
    const out = morphText(byId(id).content, store.getState());
    assert(!RAW.test(out), `"${id}" prose has no raw [TAGS] after morphText`);
  }
  console.log('');

  // --- Beat 1: fresh start deals the awakening ---
  let beat = next();
  assert(beat?.id === 'awakening_void', `opening beat is awakening_void (got ${beat?.id})`);
  assert(narrativeBridge(store.getState(), byId('awakening_void')) === '',
    'no continuity bridge on the very first beat');

  // Player merges with the spirit.
  store.dispatch(setBlessedAbility('thermal_entropy'));
  store.dispatch(revealKnowledge('spirit_merging'));
  store.dispatch(setLastChoiceId('awakening_merge_thermal'));
  store.dispatch(markStoryletSeen('awakening_void'));

  // --- Beat 2: the awakening leads to meeting the scavenger ---
  beat = next();
  assert(beat?.id === 'crater_wake', `merge leads to crater_wake (got ${beat?.id})`);

  // Player chooses the curious/peaceful response → travels to the outpost.
  store.dispatch(setLocation('borderlands_outpost'));
  store.dispatch(setGlobalFlag({ flag: 'met_kaelen', value: true }));
  store.dispatch(setLastChoiceId('crater_wake_resonance'));
  store.dispatch(markStoryletSeen('crater_wake'));

  // --- Beat 3: the CHOICE has a consequence, not a random card ---
  beat = next();
  assert(beat?.id === 'outpost_arrival_kaelen_trust',
    `asking Kaelen who they are → vouched-for arrival (got ${beat?.id})`);
  assert(narrativeBridge(store.getState(), byId('outpost_arrival_kaelen_trust')) !== '',
    'consequence beat gets a continuity bridge');

  // Player asks about the world → opens the Kaelen thread.
  store.dispatch(openThread('kaelen_bond'));
  store.dispatch(setLastChoiceId('arrival_trust_ask'));
  store.dispatch(markStoryletSeen('outpost_arrival_kaelen_trust'));

  // --- Beat 4: the open thread advances to its payoff ---
  beat = next();
  assert(beat?.id === 'kaelen_offer',
    `open thread advances to Kaelen's offer (got ${beat?.id})`);
  assert(narrativeBridge(store.getState(), byId('kaelen_offer')) !== '',
    'threaded payoff beat gets a continuity bridge');

  console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
