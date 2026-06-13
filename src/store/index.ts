import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './slices/playerSlice';
import gameReducer from './slices/gameSlice';
import { loggerMiddleware } from './middleware/logger';
import { guardrailMiddleware } from './middleware/guardrails';

export const store = configureStore({
  reducer: {
    player: playerReducer,
    game: gameReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(loggerMiddleware, guardrailMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
