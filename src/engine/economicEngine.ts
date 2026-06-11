import type { RootState, AppDispatch } from '../store';
import { changeWealth } from '../store/slices/playerSlice';
import { incrementTime } from '../store/slices/gameSlice';
import politicalData from '../data/politicalData.json';
import type { Property } from '../types/game';

/**
 * Processes a single economic/world tick (e.g., every 5 seconds).
 * Handles passive income, property upkeep, and game time advancement.
 */
export const processEconomicTick = (state: RootState, dispatch: AppDispatch) => {
  const { game } = state;

  // 1. Advance Game Time
  dispatch(incrementTime(10)); // Advance by 10 "ticks" (minutes) per cycle

  // 2. Process Real Estate Income & Upkeep
  let netIncome = 0;
  
  game.ownedProperties.forEach((propertyId) => {
    const data = politicalData.properties.find(p => p.id === propertyId) as Property | undefined;
    if (data) {
      let income = data.baseIncome;
      let upkeep = data.upkeep;

      // Apply Faction Sanctions
      if (data.ownerFaction) {
        const factionRep = game.reputation[data.ownerFaction] || 0;
        if (factionRep < -500) {
          // Seizure/Sanction: Income dropped significantly
          income *= 0.1;
          upkeep *= 2.0; // Fines/Legal fees
        } else if (factionRep < 0) {
          income *= 0.7; // Heavy taxing
        }
      }

      netIncome += (income - upkeep);
    }
  });

  if (netIncome !== 0) {
    dispatch(changeWealth(Math.floor(netIncome / 12))); // Distributed per "hour" (if 10 mins per 5s, 6 ticks = 1 hour)
  }

  // 3. Global Event Dispatcher (Simplified)
  // Check for bounty triggers based on menace/actions
  // This would usually be more complex, but we'll add basic logic here
};
