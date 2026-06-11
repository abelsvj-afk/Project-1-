import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Player, PlayerStats } from '../../types/game';

const initialStats: PlayerStats = {
  strength: 10,
  intelligence: 10,
  dexterity: 10,
  vitality: 100,
  mentality: 100,
};

const initialState: Player = {
  stats: initialStats,
  alignment: 0,
  purity: 0,
  wealth: 100,
  afflictions: [],
  balance: 0,
  equilibrium: 0,
  inventory: [],
  location: 'eldoria_threshold',
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    updateStats: (state, action: PayloadAction<Partial<PlayerStats>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    changeAlignment: (state, action: PayloadAction<number>) => {
      state.alignment = Math.max(-1000, Math.min(1000, state.alignment + action.payload));
    },
    changePurity: (state, action: PayloadAction<number>) => {
      state.purity = Math.max(-1000, Math.min(1000, state.purity + action.payload));
    },
    changeWealth: (state, action: PayloadAction<number>) => {
      state.wealth += action.payload;
    },
    addItem: (state, action: PayloadAction<string>) => {
      state.inventory.push(action.payload);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.inventory = state.inventory.filter(item => item !== action.payload);
    },
    setLocation: (state, action: PayloadAction<string>) => {
      state.location = action.payload;
    },
    addAffliction: (state, action: PayloadAction<string>) => {
      if (!state.afflictions.includes(action.payload)) {
        state.afflictions.push(action.payload);
      }
    },
    removeAffliction: (state, action: PayloadAction<string>) => {
      state.afflictions = state.afflictions.filter(id => id !== action.payload);
    },
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    setEquilibrium: (state, action: PayloadAction<number>) => {
      state.equilibrium = action.payload;
    },
  },
});

export const {
  updateStats,
  changeAlignment,
  changePurity,
  changeWealth,
  addItem,
  removeItem,
  setLocation,
  addAffliction,
  removeAffliction,
  setBalance,
  setEquilibrium,
} = playerSlice.actions;

export default playerSlice.reducer;
