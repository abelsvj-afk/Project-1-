import type { Middleware } from '@reduxjs/toolkit';

const SAVE_KEY = 'eldoria_v1_save';

// Debounce timer — avoid writing on every rapid action
let saveTimer: ReturnType<typeof setTimeout> | null = null;

// Actions that trigger a save (skip volatile tick actions)
const SAVE_SKIP = new Set([
  'game/incrementTime',
  'game/tickEnemy',
  'player/tickCombat',
  'game/addCombatLog',
]);

export const persistenceMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  if (!SAVE_SKIP.has(action.type)) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const state = store.getState();
      // Don't persist mid-combat — volatile state
      if (!state.game.activeCombat) {
        try {
          localStorage.setItem(SAVE_KEY, JSON.stringify({
            player: state.player,
            game: state.game,
          }));
        } catch {
          // Storage quota exceeded or unavailable — silently skip
        }
      }
    }, 1500);
  }

  return result;
};

export const loadSavedState = (): { player?: any; game?: any } | undefined => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    // Merge saved state but keep fresh NPC data from socialData in case of updates
    return parsed;
  } catch {
    return undefined;
  }
};

export const clearSave = () => {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
};
