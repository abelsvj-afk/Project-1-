import type { RootState, AppDispatch } from '../store';
import { tickCombat, takeDamage, consumeMentality, setBalance, setEquilibrium, applyCure, removeItem } from '../store/slices/playerSlice';
import combatData from '../data/combatData.json';
import type { CombatAffliction, CombatSpell, CombatCure } from '../types/game';
import { withDiagnostics } from './utils/diagnostics';

/**
 * Processes a single combat tick (e.g., 100ms).
 * Handles balance/equilibrium recovery and affliction effects.
 */
const _processCombatTick = (state: RootState, dispatch: AppDispatch) => {
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

export const processCombatTick = withDiagnostics(_processCombatTick, 'processCombatTick');

/**
 * Handles casting a spell.
 * Returns true if successful, false if not enough balance/equilibrium/mentality.
 */
const _castSpell = (spellId: string, state: RootState, dispatch: AppDispatch): boolean => {
  const { player } = state;
  const spell = combatData.spells.find(s => s.id === spellId) as CombatSpell | undefined;

  if (!spell) return false;

  // Check costs
  if (player.balance > 0 && spell.cost.balance) return false; // Simple check: if already off-balance
  if (player.equilibrium > 0 && spell.cost.equilibrium) return false;
  if (player.stats.mentality < (spell.cost.mentality || 0)) return false;

  // Apply costs
  if (spell.cost.mentality) dispatch(consumeMentality(spell.cost.mentality));
  if (spell.cost.balance) dispatch(setBalance(spell.cost.balance));
  if (spell.cost.equilibrium) dispatch(setEquilibrium(spell.cost.equilibrium));
  
  // Apply effects (to enemy - for now just log or simple state)
  console.log(`Casting ${spell.name}...`);
  
  return true;
};

export const castSpell = withDiagnostics(_castSpell, 'castSpell');

/**
 * Uses a curative item from the inventory.
 * Enforces the Achaea-style Cure Matrix (delivery methods affect different cooldowns).
 */
const _useCure = (cureId: string, state: RootState, dispatch: AppDispatch): boolean => {
  const { player } = state;
  const cure = combatData.cures.find(c => c.id === cureId) as CombatCure | undefined;

  if (!cure) return false;
  if (!player.inventory.includes(cure.id)) return false; // Must have it in inventory

  // Achaea Action Economy: 
  // Topical (salves) and Smoke use Balance (Physical)
  // Ingestion (herbs) use Equilibrium (Mental focus/digestion)
  if (cure.delivery === 'topical' || cure.delivery === 'smoke') {
      if (player.balance > 0) {
          console.log(`Cannot use ${cure.name}, off balance.`);
          return false;
      }
      dispatch(setBalance(1500)); // 1.5s cooldown
  } else if (cure.delivery === 'ingestion' || cure.delivery === 'inhalation') {
      if (player.equilibrium > 0) {
          console.log(`Cannot use ${cure.name}, lack equilibrium.`);
          return false;
      }
      dispatch(setEquilibrium(1500)); // 1.5s cooldown
  }

  // Consume the item
  dispatch(removeItem(cure.id));

  // Determine which affliction is cured.
  // Prioritize the first affliction in the cure's list that the player actually has.
  const afflictionToCure = cure.cures.find(a => player.afflictions.includes(a));

  if (afflictionToCure) {
      dispatch(applyCure([afflictionToCure]));
      console.log(`Cured ${afflictionToCure} using ${cure.name}.`);
      return true;
  }

  console.log(`Used ${cure.name}, but it had no effect.`);
  return true; // Still used the item and triggered cooldown
};

export const useCure = withDiagnostics(_useCure, 'useCure');

