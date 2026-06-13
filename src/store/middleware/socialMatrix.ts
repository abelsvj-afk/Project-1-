import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { updateRelationship } from '../slices/gameSlice';

/**
 * Social Matrix Middleware
 * Automates secondary relationship effects and cascades.
 * e.g., High fear lowers trust, High romance increases trust.
 */
export const socialMatrixMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);
  const state = store.getState() as RootState;

  if (action.type === updateRelationship.type) {
    const { npcId, type, change } = action.payload;
    const rel = state.game.relationships[npcId];

    if (rel) {
      // 1. Fear/Trust Cascade
      // If fear is high (> 50), every point of fear added lowers trust by 0.5
      if (type === 'fear' && change > 0 && rel.fear > 50) {
          const trustLower = Math.floor(change * 0.5);
          if (trustLower > 0) {
              // We must use setTimeout or similar to dispatch after the current action 
              // to avoid infinite loops and ensuring consistency.
              // Better yet: we check if we've already dispatched this cascade to avoid recursion.
              if (!(action as any).isCascade) {
                  setTimeout(() => {
                      store.dispatch({
                          ...updateRelationship({ npcId, type: 'trust', change: -trustLower }),
                          isCascade: true
                      } as any);
                  }, 0);
              }
          }
      }

      // 2. Romance/Trust Cascade
      // High romance naturally increases trust over time or per action
      if (type === 'romance' && change > 0) {
          const trustBoost = Math.floor(change * 0.2);
          if (trustBoost > 0 && !(action as any).isCascade) {
              setTimeout(() => {
                  store.dispatch({
                      ...updateRelationship({ npcId, type: 'trust', change: trustBoost }),
                      isCascade: true
                  } as any);
              }, 0);
          }
      }
    }
  }

  return result;
};
