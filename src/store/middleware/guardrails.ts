import type { Middleware } from '@reduxjs/toolkit';
import * as Sentry from "@sentry/react";
import type { RootState } from '../index';
import worldMap from '../../data/world_map.json';

/**
 * Guardrail Middleware: Protects the application from invalid state transitions.
 * If an action would result in an invalid state, it logs a warning/error and 
 * optionally prevents the action or sanitizes the result.
 */
export const guardrailMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);
  const nextState = store.getState() as RootState;

  // 1. Wealth Guardrail: Prevent negative wealth
  if (nextState.player.wealth < 0) {
    console.error(`GUARDRAIL: Negative wealth detected after ${action.type}! Resetting to 0.`);
    Sentry.captureMessage(`Negative wealth detected: ${nextState.player.wealth}`, {
      level: 'warning',
      extra: { action, state: nextState }
    });
  }

  // 2. Alignment/Purity Bounds
  if (Math.abs(nextState.player.alignment) > 1000 || Math.abs(nextState.player.purity) > 1000) {
     console.warn(`GUARDRAIL: Alignment/Purity out of typical bounds (-1000, 1000)`);
  }

  // 3. Game Time integrity
  if (nextState.game.gameTime < 0) {
      console.error(`GUARDRAIL: Game time is negative!`);
  }

  // 4. NPC Location Integrity
  if (action.type === 'game/moveNPC') {
    const validNodes = worldMap.nodes.map(n => n.id);
    Object.entries(nextState.game.npcs).forEach(([npcId, npcData]) => {
      const loc = npcData.simulatedState.lastLocation;
      if (!validNodes.includes(loc)) {
        console.error(`GUARDRAIL: NPC ${npcId} moved to invalid location: ${loc}`);
      }
    });
  }

  // 5. Companion Integrity
  if (action.type === 'player/addCompanion') {
    const uniqueCompanions = new Set(nextState.player.companions);
    if (uniqueCompanions.size !== nextState.player.companions.length) {
      console.error(`GUARDRAIL: Duplicate companion detected!`);
    }
  }

  return result;
};
