import type { RootState, AppDispatch } from '../store';
import {
  tickCombat, takeDamage, consumeMentality, setBalance, setEquilibrium,
  applyCure, removeItem, addAffliction,
} from '../store/slices/playerSlice';
import {
  tickEnemy, damageEnemy, afflictEnemy, setEnemyBalance, setEnemyEquilibrium,
  addCombatLog, endCombat, incrementCombatRound,
} from '../store/slices/gameSlice';
import { gainExperience } from '../store/slices/playerSlice';
import { triggerLootDrop } from './lootEngine';
import combatData from '../data/combatData.json';
import type { CombatAffliction, CombatSpell, CombatCure, EnemyAttack } from '../types/game';
import { withDiagnostics } from './utils/diagnostics';

// ─── Player Affliction Tick ────────────────────────────────────────────────

const _processPlayerAfflictions = (state: RootState, dispatch: AppDispatch) => {
  const { player } = state;
  player.afflictions.forEach((afflictionId) => {
    const data = combatData.afflictions.find(a => a.id === afflictionId) as CombatAffliction | undefined;
    if (!data?.effectOnTick) return;

    const { vitalityChange, mentalityChange, balanceDrain, equilibriumDrain } = data.effectOnTick;

    // vitalityChange is negative for damage (e.g. -5), so negate to get damage amount
    if (vitalityChange && vitalityChange < 0) {
      dispatch(takeDamage(-vitalityChange));
    }
    if (mentalityChange && mentalityChange < 0) {
      dispatch(consumeMentality(-mentalityChange));
    }
    // Balance/equilibrium drain adds to cooldown (keeps player off-balance)
    if (balanceDrain) {
      dispatch(setBalance(Math.min(3000, player.balance + balanceDrain)));
    }
    if (equilibriumDrain) {
      dispatch(setEquilibrium(Math.min(3000, player.equilibrium + equilibriumDrain)));
    }
  });
};

// ─── Enemy Affliction Tick ─────────────────────────────────────────────────

const _processEnemyAfflictions = (state: RootState, dispatch: AppDispatch) => {
  const combat = state.game.activeCombat;
  if (!combat || combat.isOver) return;

  combat.enemy.afflictions.forEach((afflictionId) => {
    const data = combatData.afflictions.find(a => a.id === afflictionId) as CombatAffliction | undefined;
    if (!data?.effectOnTick) return;

    const { vitalityChange, balanceDrain, equilibriumDrain } = data.effectOnTick;

    if (vitalityChange && vitalityChange < 0) {
      dispatch(damageEnemy(-vitalityChange));
      dispatch(addCombatLog({ msg: `${combat.enemy.name} suffers ${-vitalityChange} damage from ${data.name}.`, type: 'system' }));
    }
    if (balanceDrain) {
      dispatch(setEnemyBalance(Math.min(4000, combat.enemy.balance + balanceDrain)));
    }
    if (equilibriumDrain) {
      dispatch(setEnemyEquilibrium(Math.min(4000, combat.enemy.equilibrium + equilibriumDrain)));
    }
  });
};

// ─── Enemy AI ──────────────────────────────────────────────────────────────

const _runEnemyAI = (state: RootState, dispatch: AppDispatch) => {
  const combat = state.game.activeCombat;
  if (!combat || combat.isOver) return;

  const enemy = combat.enemy;
  if (enemy.balance > 0 && enemy.equilibrium > 0) return; // not ready for any action

  // Filter attacks by readiness
  const readyAttacks = (enemy.attacks as EnemyAttack[]).filter(a => {
    if (a.type === 'physical' && (!a.balanceCost || enemy.balance === 0)) return true;
    if (a.type === 'mental' && (!a.equilibriumCost || enemy.equilibrium === 0)) return true;
    return false;
  });

  if (readyAttacks.length === 0) return;

  // Slight AI: if player has no afflictions, prefer affliction attacks; else prefer damage
  const playerHasAfflictions = state.player.afflictions.length > 0;
  const damageAttacks = readyAttacks.filter(a => a.damage > 0 && !a.affliction);
  const afflictAttacks = readyAttacks.filter(a => a.affliction);

  let attack: EnemyAttack;
  if (!playerHasAfflictions && afflictAttacks.length > 0 && Math.random() < 0.6) {
    attack = afflictAttacks[Math.floor(Math.random() * afflictAttacks.length)];
  } else if (damageAttacks.length > 0 && Math.random() < 0.5) {
    attack = damageAttacks[Math.floor(Math.random() * damageAttacks.length)];
  } else {
    attack = readyAttacks[Math.floor(Math.random() * readyAttacks.length)];
  }

  // Apply attack
  const statScale = (enemy.stats.vessel + enemy.stats.logic) / 20; // 0–1 scale for level 10 enemies
  const scaledDamage = Math.max(1, Math.floor(attack.damage * (0.8 + statScale * 0.4)));

  if (scaledDamage > 0) {
    dispatch(takeDamage(scaledDamage));
  }
  if (attack.affliction && !state.player.afflictions.includes(attack.affliction)) {
    if (Math.random() < 0.5) { // 50% chance to apply affliction
      dispatch(addAffliction(attack.affliction));
      dispatch(addCombatLog({
        msg: `${enemy.name} uses ${attack.name} for ${scaledDamage} damage and inflicts ${attack.affliction.replace(/_/g, ' ')}!`,
        type: 'enemy',
      }));
    } else {
      dispatch(addCombatLog({ msg: `${enemy.name} uses ${attack.name} for ${scaledDamage} damage.`, type: 'enemy' }));
    }
  } else {
    dispatch(addCombatLog({ msg: `${enemy.name} uses ${attack.name} for ${scaledDamage} damage.`, type: 'enemy' }));
  }

  // Set cooldown on the attack type used
  if (attack.balanceCost || attack.type === 'physical') {
    dispatch(setEnemyBalance(attack.balanceCost ?? 2000));
  }
  if (attack.equilibriumCost || attack.type === 'mental') {
    dispatch(setEnemyEquilibrium(attack.equilibriumCost ?? 2000));
  }
};

// ─── Companion Assists ─────────────────────────────────────────────────────
// Active companions periodically act in combat, driven by their personality
// archetype, satisfying the GEMINI.md mandate that companions provide real
// mechanical utility in the Combat view (not just narrative flavor).

const COMPANION_ASSIST_INTERVAL = 40; // ~4s between a given companion's actions
const ASSIST_AFFLICTIONS = ['blindness', 'shivering', 'stupidity'];

type AssistKind = 'damage' | 'afflict' | 'support';
interface AssistProfile { kind: AssistKind; power: number; verb: string; }

const ARCHETYPE_ASSIST: { [archetype: string]: AssistProfile } = {
  pragmatist: { kind: 'damage', power: 8, verb: 'lands a precise shot on' },
  zealot: { kind: 'afflict', power: 5, verb: 'channels a hostile current at' },
  scholar: { kind: 'support', power: 6, verb: 'covers you' },
  greed: { kind: 'damage', power: 6, verb: 'strikes an opportunistic blow at' },
};

const assistFor = (archetype?: string): AssistProfile =>
  (archetype && ARCHETYPE_ASSIST[archetype]) || ARCHETYPE_ASSIST.pragmatist;

/** Human-readable label for a companion's combat role, for the UI. */
export const companionAssistLabel = (archetype?: string): string => {
  switch (assistFor(archetype).kind) {
    case 'support': return 'Support — clears your afflictions';
    case 'afflict': return 'Caster — afflicts the enemy';
    default: return 'Striker — deals damage';
  }
};

const _runCompanionAssists = (state: RootState, dispatch: AppDispatch) => {
  const combat = state.game.activeCombat;
  if (!combat || combat.isOver) return;
  const { player, game } = state;

  player.companions.forEach((id, i) => {
    // Stagger companions so they don't all fire on the same tick.
    if (combat.round % COMPANION_ASSIST_INTERVAL !== (i * 7) % COMPANION_ASSIST_INTERVAL) return;
    const npc = game.npcs[id];
    if (!npc) return;
    const prof = assistFor(npc.personality?.archetype);
    const name = npc.name || id;

    if (prof.kind === 'support') {
      if (player.afflictions.length > 0) {
        const aff = player.afflictions[0];
        dispatch(applyCure([aff]));
        dispatch(addCombatLog({ msg: `${name} ${prof.verb}, clearing your ${aff.replace(/_/g, ' ')}.`, type: 'player' }));
      } else {
        dispatch(damageEnemy(prof.power));
        dispatch(addCombatLog({ msg: `${name} lays down covering fire on ${combat.enemy.name} (${prof.power}).`, type: 'player' }));
      }
    } else if (prof.kind === 'afflict') {
      dispatch(damageEnemy(prof.power));
      const aff = ASSIST_AFFLICTIONS[combat.round % ASSIST_AFFLICTIONS.length];
      dispatch(afflictEnemy(aff));
      dispatch(addCombatLog({ msg: `${name} ${prof.verb} ${combat.enemy.name}, inflicting ${aff}.`, type: 'player' }));
    } else {
      dispatch(damageEnemy(prof.power));
      dispatch(addCombatLog({ msg: `${name} ${prof.verb} ${combat.enemy.name} (${prof.power}).`, type: 'player' }));
    }
  });
};

// ─── Combat Resolution ─────────────────────────────────────────────────────

const _checkCombatResolution = (state: RootState, dispatch: AppDispatch) => {
  const combat = state.game.activeCombat;
  if (!combat || combat.isOver) return;

  if (state.player.stats.vitality <= 0) {
    dispatch(endCombat({ playerWon: false }));
    dispatch(addCombatLog({ msg: 'You have been defeated. Darkness closes in...', type: 'system' }));
    return;
  }

  if (combat.enemy.vitality <= 0) {
    dispatch(endCombat({ playerWon: true }));
    dispatch(addCombatLog({ msg: `${combat.enemy.name} has been defeated!`, type: 'system' }));
    // Grant XP
    dispatch(gainExperience(combat.enemy.xpReward));
    // Grant loot
    triggerLootDrop(combat.enemy.lootTable, dispatch);
    dispatch(addCombatLog({ msg: `You gain ${combat.enemy.xpReward} XP.`, type: 'system' }));
  }
};

// ─── Main Combat Tick (100ms) ──────────────────────────────────────────────

const _processCombatTick = (state: RootState, dispatch: AppDispatch) => {
  const combat = state.game.activeCombat;
  if (!combat || combat.isOver) {
    // Even outside structured combat, tick player balance/equilibrium recovery
    dispatch(tickCombat());
    return;
  }

  // Tick cooldowns
  dispatch(tickCombat());
  dispatch(tickEnemy());

  // Process afflictions every 10 ticks (~1 second) to avoid too-rapid damage
  if (combat.round % 10 === 0) {
    _processPlayerAfflictions(state, dispatch);
    _processEnemyAfflictions(state, dispatch);
  }

  // Enemy AI
  _runEnemyAI(state, dispatch);

  // Companion assists
  _runCompanionAssists(state, dispatch);

  // Check for win/lose
  _checkCombatResolution(state, dispatch);

  dispatch(incrementCombatRound());
};

export const processCombatTick = withDiagnostics(_processCombatTick, 'processCombatTick');

// ─── Cast Spell ────────────────────────────────────────────────────────────

const _castSpell = (spellId: string, state: RootState, dispatch: AppDispatch): boolean => {
  const { player } = state;
  const combat = state.game.activeCombat;
  const spell = combatData.spells.find(s => s.id === spellId) as CombatSpell | undefined;

  if (!spell) return false;
  if (!combat || combat.isOver) {
    dispatch(addCombatLog({ msg: 'No target — enter combat first.', type: 'system' }));
    return false;
  }

  // Block if the relevant cooldown is active
  if (spell.cost.balance && player.balance > 0) {
    dispatch(addCombatLog({ msg: `Cannot cast — physically off-balance (${(player.balance / 1000).toFixed(1)}s).`, type: 'system' }));
    return false;
  }
  if (spell.cost.equilibrium && player.equilibrium > 0) {
    dispatch(addCombatLog({ msg: `Cannot cast — mentally unsteady (${(player.equilibrium / 1000).toFixed(1)}s).`, type: 'system' }));
    return false;
  }
  if (player.stats.mentality < (spell.cost.mentality || 0)) {
    dispatch(addCombatLog({ msg: 'Insufficient mentality to cast.', type: 'system' }));
    return false;
  }

  // Deduct costs
  if (spell.cost.mentality) dispatch(consumeMentality(spell.cost.mentality));
  if (spell.cost.balance) dispatch(setBalance(spell.cost.balance));
  if (spell.cost.equilibrium) dispatch(setEquilibrium(spell.cost.equilibrium));

  // Scale damage by player's relevant stat
  const statMap: Record<string, keyof typeof player.stats> = {
    thermal: 'vessel',
    vector: 'logic',
    cognitive: 'finesse',
    biomorphic: 'resonance',
  };
  const relevantStat = player.stats[statMap[spell.current] ?? 'logic'];
  const baseScale = relevantStat / 10; // stat 10 = 100%, stat 20 = 200%
  const damage = Math.floor((spell.effects.damage ?? 0) * (0.5 + baseScale * 0.5));

  if (damage > 0) {
    dispatch(damageEnemy(damage));
  }

  // Apply afflictions to enemy
  const appliedAfflictions: string[] = [];
  (spell.effects.applyAfflictions ?? []).forEach(afflId => {
    if (!combat.enemy.afflictions.includes(afflId) && Math.random() < 0.6) {
      dispatch(afflictEnemy(afflId));
      appliedAfflictions.push(afflId.replace(/_/g, ' '));
    }
  });

  const afflLog = appliedAfflictions.length ? ` Inflicts: ${appliedAfflictions.join(', ')}.` : '';
  dispatch(addCombatLog({
    msg: `You cast ${spell.name} for ${damage} damage.${afflLog}`,
    type: 'player',
  }));

  return true;
};

export const castSpell = withDiagnostics(_castSpell, 'castSpell');

// ─── Use Cure ──────────────────────────────────────────────────────────────

const _useCure = (cureId: string, state: RootState, dispatch: AppDispatch): boolean => {
  const { player } = state;
  const cure = combatData.cures.find(c => c.id === cureId) as CombatCure | undefined;

  if (!cure) return false;

  // Check inventory — handle both string IDs and Equipment objects
  const hasItem = player.inventory.some(i => (typeof i === 'string' ? i : i.id) === cure.id);
  if (!hasItem) return false;

  // Enforce Achaea-style delivery cooldowns
  if (cure.delivery === 'topical' || cure.delivery === 'smoke') {
    if (player.balance > 0) {
      dispatch(addCombatLog({ msg: `Cannot use ${cure.name} — off balance.`, type: 'system' }));
      return false;
    }
    dispatch(setBalance(1500));
  } else {
    if (player.equilibrium > 0) {
      dispatch(addCombatLog({ msg: `Cannot use ${cure.name} — equilibrium disrupted.`, type: 'system' }));
      return false;
    }
    dispatch(setEquilibrium(1500));
  }

  dispatch(removeItem(cure.id));

  const afflictionToCure = cure.cures.find(a => player.afflictions.includes(a));
  if (afflictionToCure) {
    dispatch(applyCure([afflictionToCure]));
    dispatch(addCombatLog({ msg: `You use ${cure.name} and cure ${afflictionToCure.replace(/_/g, ' ')}.`, type: 'player' }));
    return true;
  }

  dispatch(addCombatLog({ msg: `You use ${cure.name}, but it has no effect on your current afflictions.`, type: 'system' }));
  return true;
};

export const useCure = withDiagnostics(_useCure, 'useCure');
