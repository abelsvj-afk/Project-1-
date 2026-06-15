import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './slices/playerSlice';
import gameReducer from './slices/gameSlice';
import { loggerMiddleware } from './middleware/logger';
import { guardrailMiddleware } from './middleware/guardrails';
import { socialMatrixMiddleware } from './middleware/socialMatrix';
import { persistenceMiddleware, loadSavedState } from './persistence';

const preloadedState = loadSavedState();

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
