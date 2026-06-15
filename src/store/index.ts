import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './slices/playerSlice';
import gameReducer from './slices/gameSlice';
import { loggerMiddleware } from './middleware/logger';
import { guardrailMiddleware } from './middleware/guardrails';
import { socialMatrixMiddleware } from './middleware/socialMatrix';
import { persistenceMiddleware, loadSavedState } from './persistence';

// Hydrate any saved state OVER the reducers' default state. Redux's preloadedState
// replaces a slice wholesale, so a save written before a new field existed would
// load that field as `undefined` and crash the engine. Merging over defaults
// backfills missing fields while preserving saved progress.
const savedState = loadSavedState();
const defaultState = {
  player: playerReducer(undefined, { type: '@@HYDRATE' }),
  game: gameReducer(undefined, { type: '@@HYDRATE' }),
};
const preloadedState = savedState
  ? {
      player: { ...defaultState.player, ...savedState.player },
      game: { ...defaultState.game, ...savedState.game },
    }
  : undefined;

export const store = configureStore({
  reducer: {
    player: playerReducer,
    game: gameReducer,
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      loggerMiddleware,
      guardrailMiddleware,
      socialMatrixMiddleware,
      persistenceMiddleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
