import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './slices/playerSlice';
import gameReducer from './slices/gameSlice';

export const store = configureStore({
  reducer: {
    player: playerReducer,
    game: gameReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
