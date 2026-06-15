import type { RootState, AppDispatch } from '../store';
import { changeWealth } from '../store/slices/playerSlice';
import { incrementTime, addBounty } from '../store/slices/gameSlice';
import politicalData from '../data/politicalData.json';
import type { Property } from '../types/game';
import { withDiagnostics } from './utils/diagnostics';

/**
 * Processes one economic tick (fires every 5 seconds).
 * Handles passive property income, game-time advancement, and bounty escalation.
 */
const _processEconomicTick = (state: RootState, dispatch: AppDispatch) => {
  const { player, game } = state;

  // 1. Advance Game Time (10 units per tick ≈ ~4 ticks per in-game hour)
  dispatch(incrementTime(10));

  // 2. Property Income & Upkeep
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
  // Each tick is 5s; one game-day is ~720 ticks → income/720 per tick
  if (netIncome !== 0) dispatch(changeWealth(Math.floor(netIncome / 720)));

  // 3. Bounty Escalation — only when menace is very high and no existing bounty from that faction
  Object.entries(player.history.factionMenace).forEach(([factionId, menaceValue]) => {
    const menace = menaceValue as number;
    if (menace > 80) {
      const existingBounty = game.activeBounties.find(b => b.factionId === factionId && b.targetId === 'player');
      if (!existingBounty && Math.random() > 0.95) {
        dispatch(addBounty({
          id: `bounty_${factionId}_${Date.now()}`,
          factionId,
          targetId: 'player',
          amount: Math.floor(menace * 10),
          reason: "High menace to faction interests",
        }));
      }
    }
  });
};

export const processEconomicTick = withDiagnostics(_processEconomicTick, 'processEconomicTick');
