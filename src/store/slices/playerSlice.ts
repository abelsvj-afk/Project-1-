import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Player, PlayerStats } from '../../types/game';

const initialStats: PlayerStats = {
  prowess: 10,
  logic: 10,
  finesse: 10,
  sync: 10,
  vitality: 100,
  mentality: 100,
};

const initialState: Player = {
  name: 'Stranger',
  appearance: {
    bodyType: 'average',
    musculature: 'lean',
    height: 'average',
    hairStyle: 'unkempt',
    hairColor: 'dusty',
    eyeColor: 'clear',
    eyeType: 'organic',
    skinTone: 'pale',
    scars: [],
    tattoos: [],
    facialFeatures: [],
  },
  pronouns: {
    subject: 'they',
    object: 'them',
    possessive: 'their',
  },
  stats: initialStats,
  alignment: 0,
  purity: 0,
  wealth: 100,
  afflictions: [],
  balance: 0,
  equilibrium: 0,
  inventory: [],
  location: 'static_crater',
  history: {
    majorChoices: [],
    factionInfluence: { scavengers: 0, syndicate: 0, adepts: 0 },
    factionMenace: { scavengers: 0, syndicate: 0, adepts: 0 },
  }
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    logChoice: (state, action: PayloadAction<string>) => {
      if (!state.history.majorChoices.includes(action.payload)) {
        state.history.majorChoices.push(action.payload);
      }
    },
    changeInfluence: (state, action: PayloadAction<{ faction: string; amount: number }>) => {
      const { faction, amount } = action.payload;
      if (state.history.factionInfluence[faction] !== undefined) {
        state.history.factionInfluence[faction] = Math.max(-100, Math.min(100, state.history.factionInfluence[faction] + amount));
      }
    },
    changeMenace: (state, action: PayloadAction<{ faction: string; amount: number }>) => {
      const { faction, amount } = action.payload;
      if (state.history.factionMenace[faction] !== undefined) {
        state.history.factionMenace[faction] = Math.max(0, Math.min(100, state.history.factionMenace[faction] + amount));
      }
    },
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
    tickCombat: (state) => {
      // Recover balance and equilibrium over time
      state.balance = Math.max(0, state.balance - 100);
      state.equilibrium = Math.max(0, state.equilibrium - 100);
    },
    takeDamage: (state, action: PayloadAction<number>) => {
      state.stats.vitality = Math.max(0, state.stats.vitality - action.payload);
    },
    consumeMentality: (state, action: PayloadAction<number>) => {
      state.stats.mentality = Math.max(0, state.stats.mentality - action.payload);
    },
    applyCure: (state, action: PayloadAction<string[]>) => {
      state.afflictions = state.afflictions.filter(a => !action.payload.includes(a));
    },
    setIdentity: (state, action: PayloadAction<{ name: string; appearance: any; pronouns: any; presence: any; presenceDescription: string }>) => {
      state.name = action.payload.name;
      state.appearance = action.payload.appearance;
      state.pronouns = action.payload.pronouns;
      state.presence = action.payload.presence;
      state.presenceDescription = action.payload.presenceDescription;
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
  tickCombat,
  takeDamage,
  consumeMentality,
  applyCure,
  setIdentity,
  logChoice,
  changeInfluence,
  changeMenace,
} = playerSlice.actions;

export default playerSlice.reducer;
