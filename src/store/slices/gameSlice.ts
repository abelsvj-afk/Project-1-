import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ReputationMatrix } from '../../types/game';

interface GameStateSlice {
  reputation: ReputationMatrix;
  globalFlags: { [flag: string]: boolean | number | string };
  gameTime: number;
  currentStorylets: string[];
}

const initialState: GameStateSlice = {
  reputation: {},
  globalFlags: {},
  gameTime: 0,
  currentStorylets: [],
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    updateReputation: (state, action: PayloadAction<{ factionId: string; change: number }>) => {
      const { factionId, change } = action.payload;
      state.reputation[factionId] = (state.reputation[factionId] || 0) + change;
    },
    setGlobalFlag: (state, action: PayloadAction<{ flag: string; value: boolean | number | string }>) => {
      state.globalFlags[action.payload.flag] = action.payload.value;
    },
    incrementTime: (state, action: PayloadAction<number>) => {
      state.gameTime += action.payload;
    },
    setCurrentStorylets: (state, action: PayloadAction<string[]>) => {
      state.currentStorylets = action.payload;
    },
  },
});

export const {
  updateReputation,
  setGlobalFlag,
  incrementTime,
  setCurrentStorylets,
} = gameSlice.actions;

export default gameSlice.reducer;
