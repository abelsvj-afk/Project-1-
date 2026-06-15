import type { RootState, AppDispatch } from '../store';
import { changeWealth } from '../store/slices/playerSlice';
import { incrementTime, addBounty, setIncomeBuffer } from '../store/slices/gameSlice';
import politicalData from '../data/politicalData.json';
import type { Property } from '../types/game';
import { withDiagnostics } from './utils/diagnostics';

const TICKS_PER_DAY = 720; // one economic tick is ~5s

/** Employment roles: passive shards/day at tier 1, scaled by employee tier. */
export const EMPLOYEE_ROLES: { [role: string]: { label: string; dailyIncome: number; blurb: string } } = {
  scavenger: { label: 'Scavenger', dailyIncome: 60, blurb: 'Combs the wastes for salvage.' },
  forager: { label: 'Forager', dailyIncome: 40, blurb: 'Gathers water and edibles.' },
  runner: { label: 'Runner', dailyIncome: 80, blurb: 'Moves goods past Syndicate eyes.' },
  guard: { label: 'Guard', dailyIncome: 30, blurb: 'Watches your holdings and people.' },
};

export const HIRE_FEE = 50;             // upfront cost to hire
export const promotionCost = (tier: number) => tier * 100; // cost to reach the next tier

/** Daily shards a single employee earns at their current tier. */
export const employeeDailyIncome = (role: string, tier: number) =>
  (EMPLOYEE_ROLES[role]?.dailyIncome ?? 0) * tier;

/**
 * Processes one economic tick (fires every 5 seconds).
 * Handles passive property + workforce income (via a fractional accrual buffer
 * so small daily totals actually pay out), game-time, and bounty escalation.
 */
const _processEconomicTick = (state: RootState, dispatch: AppDispatch) => {
  const { player, game } = state;

  // 1. Advance Game Time (10 units per tick ≈ ~4 ticks per in-game hour)
  dispatch(incrementTime(10));

  // 2. Property Income & Upkeep (daily totals)
  let dailyNet = 0;
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
      dailyNet += (income - upkeep);
    }
  });

  // 2b. Workforce wages (daily totals)
  (game.employees ?? []).forEach(emp => {
    dailyNet += employeeDailyIncome(emp.role, emp.tier);
  });

  // Accrue the per-tick fraction into a buffer; pay out whole shards as they
  // accumulate so even a modest daily income is never silently floored to 0.
  let buffer = (game.incomeBuffer ?? 0) + dailyNet / TICKS_PER_DAY;
  const payout = Math.trunc(buffer);
  if (payout !== 0) {
    dispatch(changeWealth(payout));
    buffer -= payout;
  }
  dispatch(setIncomeBuffer(buffer));

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
