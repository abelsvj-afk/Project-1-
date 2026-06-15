import { store } from '../src/store';
import { addCompanion, addAffliction, updateStats } from '../src/store/slices/playerSlice';
import { startCombat } from '../src/store/slices/gameSlice';
import { processCombatTick, companionAssistLabel } from '../src/engine/combatEngine';
import combatData from '../src/data/combatData.json';
import type { EnemyTemplate } from '../src/types/game';

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✔ PASS' : '✗ FAIL'} ${msg}`);
  if (!cond) failures++;
};

const enemies = (combatData as any).enemies as EnemyTemplate[];
const thug = enemies.find(e => e.id === 'syndicate_thug')!;

function run() {
  console.log('=== COMPANION COMBAT SIMULATION ===\n');

  // --- Assist labels by archetype ---
  assert(companionAssistLabel('scholar').startsWith('Support'), 'scholar → Support role');
  assert(companionAssistLabel('zealot').startsWith('Caster'), 'zealot → Caster role');
  assert(companionAssistLabel('pragmatist').startsWith('Striker'), 'pragmatist → Striker role');
  console.log('');

  // --- Striker companion (Kaelen, pragmatist) chips enemy HP over a fight ---
  store.dispatch(updateStats({ vitality: 300, mentality: 200 }));
  store.dispatch(addCompanion('kaelen')); // pragmatist → damage
  store.dispatch(startCombat(thug));
  const startHp = store.getState().game.activeCombat!.enemy.vitality;

  // Run ~6s of ticks. Player does nothing; only the companion acts.
  for (let i = 0; i < 60; i++) processCombatTick(store.getState(), (a: any) => store.dispatch(a));

  const afterHp = store.getState().game.activeCombat?.enemy.vitality ?? 0;
  console.log(`Enemy HP: ${startHp} -> ${afterHp}`);
  assert(afterHp < startHp, 'companion striker damaged the enemy with no player input');

  const log = store.getState().game.activeCombat?.log ?? [];
  const kaelenActed = log.some(l => l.msg.includes('Kaelen'));
  assert(kaelenActed, 'combat log records Kaelen acting');

  // --- Support companion (Seraphina, scholar) clears a player affliction ---
  store.dispatch(addCompanion('seraphina')); // scholar → support
  store.dispatch(addAffliction('paralysis'));
  const hadAffliction = store.getState().player.afflictions.includes('paralysis');
  for (let i = 0; i < 80; i++) processCombatTick(store.getState(), (a: any) => store.dispatch(a));
  const stillAfflicted = store.getState().player.afflictions.includes('paralysis');
  console.log(`Player paralysis: present=${hadAffliction} -> stillPresent=${stillAfflicted}`);
  assert(hadAffliction && !stillAfflicted, 'support companion cleared the player’s affliction');

  console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
