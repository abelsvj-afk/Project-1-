import type { Middleware } from '@reduxjs/toolkit';
import * as Sentry from "@sentry/react";
import type { RootState } from '../index';
import worldMap from '../../data/world_map.json';

const validNodeIds = new Set(worldMap.nodes.map(n => n.id));

export const guardrailMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);
  const state = store.getState() as RootState;

  if (state.player.wealth < 0) {
    console.error(`GUARDRAIL: Negative wealth after ${action.type}`);
    Sentry.captureMessage(`Negative wealth: ${state.player.wealth}`, { level: 'warning', extra: { action } });
  }

  if (Math.abs(state.player.alignment) > 1000 || Math.abs(state.player.purity) > 1000) {
    console.warn(`GUARDRAIL: Alignment/Purity out of bounds`);
  }

  if (state.game.gameTime < 0) {
    console.error(`GUARDRAIL: Game time is negative`);
  }

  // Only validate the moved NPC, not all NPCs
  if (action.type === 'game/moveNPC') {
    const { npcId, locationId } = action.payload;
    if (!validNodeIds.has(locationId)) {
      console.error(`GUARDRAIL: NPC ${npcId} moved to invalid location: ${locationId}`);
    }
  }

  return result;
};
