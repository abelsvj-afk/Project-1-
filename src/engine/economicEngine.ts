import type { RootState, AppDispatch } from '../store';
import { changeWealth } from '../store/slices/playerSlice';
import { incrementTime, addBounty, setGlobalFlag, evolveNPC } from '../store/slices/gameSlice';
import politicalData from '../data/politicalData.json';
import socialData from '../data/socialData.json';
import type { Property, NPC } from '../types/game';
import { consolidateHistory } from './historyEngine';
import { withDiagnostics } from './utils/diagnostics';

/**
 * Processes a single economic/world tick (e.g., every 5 seconds).
 * Handles passive income, property upkeep, game time advancement, and NPC autonomy.
 */
const _processEconomicTick = (state: RootState, dispatch: AppDispatch) => {
  const { player, game } = state;

  // 1. Advance Game Time & Consolidate History
  dispatch(incrementTime(10)); 
  consolidateHistory(state);
  const currentTime = game.gameTime;

  // 2. Process Real Estate Income & Upkeep
  let netIncome = 0;
  game.ownedProperties.forEach((propertyId: string) => {
    const data = politicalData.properties.find(p => p.id === propertyId) as Property | undefined;
    if (data) {
      let income = data.baseIncome;
      let upkeep = data.upkeep;
      if (data.ownerFaction) {
        const factionRep = game.reputation[data.ownerFaction] || 0;
        if (factionRep < -500) { income *= 0.1; upkeep *= 2.0; } 
        else if (factionRep < 0) { income *= 0.7; }
      }
      netIncome += (income - upkeep);
    }
  });
  if (netIncome !== 0) dispatch(changeWealth(Math.floor(netIncome / 12))); 

  // 3. Global Bounty Dispatcher
  Object.entries(player.history.factionMenace).forEach(([factionId, menaceValue]) => {
    const menace = menaceValue as number;
    if (menace > 80) {
      const existingBounty = game.activeBounties.find(b => b.factionId === factionId && b.targetId === 'player');
      if (!existingBounty && Math.random() > 0.8) { 
        dispatch(addBounty({ id: `bounty_${Date.now()}`, factionId, targetId: 'player', amount: Math.floor(menace * 10), reason: "High menace to faction interests" }));
      }
    }
  });
};

export const processEconomicTick = withDiagnostics(_processEconomicTick, 'processEconomicTick');
