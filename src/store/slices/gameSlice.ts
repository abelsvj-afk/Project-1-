import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ReputationMatrix, Bounty, RelationshipStatus } from '../../types/game';

interface GameStateSlice {
  reputation: ReputationMatrix;
  globalFlags: { [flag: string]: boolean | number | string };
  unlockedBlueprints: string[];
  activeSpells: string[];
  
  // Politics
  activeLaws: string[];
  activeBounties: Bounty[];
  townControl: { [townId: string]: string };

  // Economy
  ownedProperties: string[];

  // Kinship
  companions: string[];
  relationships: { [npcId: string]: RelationshipStatus };
  affinity: { [npcId: string]: number };
  knownNames: string[];

  gameTime: number;
  currentStorylets: string[];
  seenStorylets: string[];
}

const initialState: GameStateSlice = {
  reputation: {},
  globalFlags: {},
  unlockedBlueprints: [],
  activeSpells: [],
  activeLaws: [],
  activeBounties: [],
  townControl: { "borderlands": "neutral" },
  ownedProperties: [],
  companions: [],
  relationships: {},
  affinity: {},
  knownNames: [],
  gameTime: 800, // Start at 8:00 AM
  currentStorylets: [],
  seenStorylets: [],
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
    unlockBlueprint: (state, action: PayloadAction<string>) => {
      if (!state.unlockedBlueprints.includes(action.payload)) {
        state.unlockedBlueprints.push(action.payload);
      }
    },
    learnSpell: (state, action: PayloadAction<string>) => {
      if (!state.activeSpells.includes(action.payload)) {
        state.activeSpells.push(action.payload);
      }
    },
    buyProperty: (state, action: PayloadAction<string>) => {
      if (!state.ownedProperties.includes(action.payload)) {
        state.ownedProperties.push(action.payload);
      }
    },
    updateAffinity: (state, action: PayloadAction<{ npcId: string; change: number }>) => {
      const { npcId, change } = action.payload;
      state.affinity[npcId] = Math.max(-100, Math.min(100, (state.affinity[npcId] || 0) + change));
      
      // Basic status shift logic
      if (state.affinity[npcId] > 50) state.relationships[npcId] = 'friend';
      if (state.affinity[npcId] < -50) state.relationships[npcId] = 'enemy';
    },
    setRelationship: (state, action: PayloadAction<{ npcId: string; status: RelationshipStatus }>) => {
      state.relationships[action.payload.npcId] = action.payload.status;
    },
    addBounty: (state, action: PayloadAction<Bounty>) => {
      state.activeBounties.push(action.payload);
    },
    incrementTime: (state, action: PayloadAction<number>) => {
      state.gameTime = (state.gameTime + action.payload) % 2400;
    },
    setCurrentStorylets: (state, action: PayloadAction<string[]>) => {
      state.currentStorylets = action.payload;
    },
    markStoryletSeen: (state, action: PayloadAction<string>) => {
      if (!state.seenStorylets.includes(action.payload)) {
        state.seenStorylets.push(action.payload);
      }
    },
    revealName: (state, action: PayloadAction<string>) => {
      if (!state.knownNames.includes(action.payload)) {
        state.knownNames.push(action.payload);
      }
    },
  },
});

export const {
  updateReputation,
  setGlobalFlag,
  unlockBlueprint,
  learnSpell,
  buyProperty,
  updateAffinity,
  setRelationship,
  addBounty,
  incrementTime,
  setCurrentStorylets,
  markStoryletSeen,
  revealName,
} = gameSlice.actions;

export default gameSlice.reducer;
