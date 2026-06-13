import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Player, PlayerStats, Appearance, Pronouns, Equipment } from '../../types/game';

const initialStats: PlayerStats = {
  vessel: 10,
  logic: 10,
  finesse: 10,
  resonance: 10,
  vitality: 100,
  mentality: 100,
  stamina: 100,
  focus: 100,
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
  level: 1,
  experience: 0,
  skillPoints: 0,
  isBlessedSkillRevealed: false,
  alignment: 0,
  purity: 0,
  wealth: 100,
  afflictions: [],
  balance: 0,
  equilibrium: 0,
  stamina: 100,
  focus: 100,
  inventory: [],
  equipment: {},
  location: 'static_crater',
  history: {
    majorChoices: [],
    factionInfluence: { scavengers: 0, syndicate: 0, adepts: 0 },
    factionMenace: { scavengers: 0, syndicate: 0, adepts: 0 },
  },
  companions: []
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    updateStats: (state, action: PayloadAction<Partial<PlayerStats>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    spendSkillPoint: (state, action: PayloadAction<keyof PlayerStats>) => {
      if (state.skillPoints > 0) {
        state.stats[action.payload] += 1;
        state.skillPoints -= 1;
        // If we upgraded stamina/focus, also boost current values
        if (action.payload === 'stamina') state.stamina += 10;
        if (action.payload === 'focus') state.focus += 10;
      }
    },
    useStamina: (state, action: PayloadAction<number>) => {
      state.stamina = Math.max(0, state.stamina - action.payload);
    },
    useFocus: (state, action: PayloadAction<number>) => {
      state.focus = Math.max(0, state.focus - action.payload);
    },
    restoreResources: (state) => {
      state.stamina = state.stats.stamina;
      state.focus = state.stats.focus;
      state.stats.vitality = 100; // Restoring vitality too
      state.stats.mentality = 100;
    },
    changeAlignment: (state, action: PayloadAction<number>) => {
      state.alignment = Math.max(-1000, Math.min(1000, state.alignment + action.payload));
    },
    changePurity: (state, action: PayloadAction<number>) => {
      state.purity = Math.max(-1000, Math.min(1000, state.purity + action.payload));
    },
    changeWealth: (state, action: PayloadAction<number>) => {
      state.wealth = Math.max(0, state.wealth + action.payload);
    },
    addItem: (state, action: PayloadAction<string | Equipment>) => {
      state.inventory.push(action.payload);
    },
    equipItem: (state, action: PayloadAction<Equipment>) => {
      const item = action.payload;
      const slot = item.slot as keyof Player['equipment'];
      
      // If there's an existing item, move it back to bag
      const existing = state.equipment[slot];
      if (existing) {
          state.inventory.push(existing);
      }

      state.equipment[slot] = item;
      
      // Remove from inventory
      state.inventory = state.inventory.filter(i => 
          typeof i === 'string' ? true : i.id !== item.id
      );
    },
    unequipItem: (state, action: PayloadAction<keyof Player['equipment']>) => {
      const item = state.equipment[action.payload];
      if (item) {
        state.inventory.push(item);
        delete state.equipment[action.payload];
      }
    },
    upgradeEquipment: (state, action: PayloadAction<{ slot: keyof Player['equipment']; cost: number }>) => {
      const { slot, cost } = action.payload;
      const item = state.equipment[slot];
      if (item && item.level < item.maxLevel && state.wealth >= cost) {
        item.level += 1;
        state.wealth -= cost;
        // Boost attributes on upgrade based on quality
        const boost = item.quality === 'artifact' ? 2 : 1;
        Object.keys(item.attributes).forEach((key) => {
          const k = key as keyof PlayerStats;
          if (item.attributes[k] !== undefined) {
            (item.attributes[k] as number) += boost;
          }
        });
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.inventory = state.inventory.filter(item => 
        typeof item === 'string' ? item !== action.payload : item.id !== action.payload
      );
    },
    gainExperience: (state, action: PayloadAction<number>) => {
      state.experience += action.payload;
      const nextLevelExp = state.level * 100;
      if (state.experience >= nextLevelExp) {
        state.level += 1;
        state.experience -= nextLevelExp;
        state.skillPoints += 2; // As per the master plan
      }
    },
    setBlessedAbility: (state, action: PayloadAction<string>) => {
      state.blessedAbility = action.payload;
    },
    revealBlessedSkill: (state) => {
      state.isBlessedSkillRevealed = true;
    },
    addCompanion: (state, action: PayloadAction<string>) => {
      if (!state.companions.includes(action.payload)) {
        state.companions.push(action.payload);
      }
    },
    removeCompanion: (state, action: PayloadAction<string>) => {
      state.companions = state.companions.filter(id => id !== action.payload);
    },
    setLocation: (state, action: PayloadAction<string>) => {
      state.location = action.payload;
      if (!state.history.majorChoices.includes(action.payload)) {
        state.history.majorChoices.push(action.payload);
      }
    },
    logChoice: (state, action: PayloadAction<string>) => {
      state.history.majorChoices.push(action.payload);
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
    setIdentity: (state, action: PayloadAction<{ name: string; appearance: Appearance; pronouns: Pronouns; presence: any; presenceDescription: string }>) => {
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
  spendSkillPoint,
  useStamina,
  useFocus,
  restoreResources,
  changeAlignment,
  changePurity,
  changeWealth,
  addItem,
  equipItem,
  unequipItem,
  upgradeEquipment,
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
  gainExperience,
  setBlessedAbility,
  revealBlessedSkill,
  addCompanion,
  removeCompanion,
} = playerSlice.actions;

export default playerSlice.reducer;
