import type { RootState, AppDispatch } from '../store';
import { tickCombat, takeDamage, consumeMentality } from '../store/slices/playerSlice';
import combatData from '../data/combatData.json';
import type { CombatAffliction, CombatSpell } from '../types/game';

/**
 * Processes a single combat tick (e.g., 100ms).
 * Handles balance/equilibrium recovery and affliction effects.
 */
export const processCombatTick = (state: RootState, dispatch: AppDispatch) => {
  const { player } = state;

  // Basic recovery (already in tickCombat reducer, but we can do more here)
  dispatch(tickCombat());

  // Process Afflictions
  player.afflictions.forEach((afflictionId) => {
    const data = combatData.afflictions.find(a => a.id === afflictionId) as CombatAffliction | undefined;
    if (data?.effectOnTick) {
      const { vitalityChange, mentalityChange } = data.effectOnTick;
      if (vitalityChange) dispatch(takeDamage(-vitalityChange)); // takeDamage subtracts, so negative is healing, but here change is likely negative
      if (mentalityChange) dispatch(consumeMentality(-mentalityChange));
      // Balance/Equilibrium drain is harder because it's additive to recovery
      // We'll keep it simple for now and just use takeDamage/consumeMentality
    }
  });
};

/**
 * Handles casting a spell.
 * Returns true if successful, false if not enough balance/equilibrium/mentality.
 */
export const castSpell = (spellId: string, state: RootState, dispatch: AppDispatch): boolean => {
  const { player } = state;
  const spell = combatData.spells.find(s => s.id === spellId) as CombatSpell | undefined;

  if (!spell) return false;

  // Check costs
  if (player.balance > 0 && spell.cost.balance) return false; // Simple check: if already off-balance
  if (player.equilibrium > 0 && spell.cost.equilibrium) return false;
  if (player.stats.mentality < (spell.cost.mentality || 0)) return false;

  // Apply costs
  if (spell.cost.mentality) dispatch(consumeMentality(spell.cost.mentality));
  // In a real MUD, balance/equilibrium are SET to a value (the cooldown)
  // Our slice uses a simple drain, but we can just set it here.
  // Actually, let's just use the tick recovery.
  
  // Apply effects (to enemy - for now just log or simple state)
  console.log(`Casting ${spell.name}...`);
  
  return true;
};
