import { store } from '../src/store';
import { reinforceContext } from '../src/store/slices/gameSlice';
import { contextAffinity, dominantTag } from '../src/engine/narrativeEngine';
import type { Storylet } from '../src/types/game';

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✔ PASS' : '✗ FAIL'} ${msg}`);
  if (!cond) failures++;
};

function run() {
  console.log('=== CONTEXT PROFILE (TAG-WEIGHTING) SIMULATION ===\n');

  // --- 1. Reinforcement builds the profile ---
  store.dispatch(reinforceContext(['aggressive', 'combat_heavy']));
  store.dispatch(reinforceContext(['aggressive', 'combat_heavy']));
  store.dispatch(reinforceContext(['aggressive']));
  let profile = store.getState().game.contextProfile;
  console.log('Profile after 3 aggressive choices:', JSON.stringify(profile));
  assert((profile.aggressive ?? 0) > (profile.combat_heavy ?? 0),
    'repeated "aggressive" outweighs less-chosen "combat_heavy"');
  assert(dominantTag(profile) === 'aggressive', 'dominant tag is "aggressive"');

  // --- 2. Cap keeps the profile responsive ---
  for (let i = 0; i < 50; i++) store.dispatch(reinforceContext(['aggressive']));
  profile = store.getState().game.contextProfile;
  assert(profile.aggressive <= 25, `aggressive weight capped at 25 (got ${profile.aggressive})`);

  // --- 3. Decay: a long pivot to "cautious" should erode the old lean ---
  for (let i = 0; i < 30; i++) store.dispatch(reinforceContext(['cautious']));
  profile = store.getState().game.contextProfile;
  console.log('Profile after pivot to cautious:', JSON.stringify(profile));
  assert(dominantTag(profile) === 'cautious', 'profile drifts — "cautious" overtakes "aggressive"');
  assert((profile.aggressive ?? 0) < 25, 'old "aggressive" lean has decayed from its cap');

  // --- 4. Resonance & tension scoring ---
  const combatStorylet: Storylet = { id: 'x', title: '', content: '', prerequisites: {}, choices: [], tags: ['combat_heavy', 'aggressive'] };
  const peaceStorylet: Storylet = { id: 'y', title: '', content: '', prerequisites: {}, choices: [], tags: ['compassionate'] };
  const neutralStorylet: Storylet = { id: 'z', title: '', content: '', prerequisites: {}, choices: [] };

  // Rebuild a strong aggressive profile for clean scoring.
  for (let i = 0; i < 20; i++) store.dispatch(reinforceContext(['aggressive', 'combat_heavy', 'ruthless']));
  profile = store.getState().game.contextProfile;

  const combatScore = contextAffinity(combatStorylet.tags, profile);
  const peaceScore = contextAffinity(peaceStorylet.tags, profile);
  const neutralScore = contextAffinity(neutralStorylet.tags, profile);
  console.log(`Scores — combat:${combatScore} peace(tension):${peaceScore} neutral:${neutralScore}`);

  assert(combatScore > neutralScore, 'resonant (combat) storylet scores above an untagged one');
  assert(neutralScore === 0, 'untagged storylet gets no context bias');
  assert(peaceScore > 0, 'opposing (compassionate vs ruthless) storylet gets a tension boost, not zero');
  assert(combatScore > peaceScore, 'direct resonance outweighs tension friction');

  console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
