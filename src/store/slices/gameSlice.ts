import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ReputationMatrix, Bounty, RelationshipStatus, NPC } from '../../types/game';
import socialData from '../../data/socialData.json';

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

  // Autonomy & NPC Tracking
  npcs: { [npcId: string]: NPC };
  npcEvolution: { [npcId: string]: { aggression: number; fear: number; observedPlayerTraits: string[] } };
  worldHistory: { event: string; timestamp: number }[];

  gameTime: number;
  currentStorylets: string[];
  seenStorylets: string[];
  knowledgeFlags: string[];
  lastStoryletId?: string;
  lastChoiceId?: string;
  narrativeHistory: { id: string; type: 'storylet' | 'choice'; text: string; title?: string }[];
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
  npcs: (socialData.npcs as any[]).reduce((acc, npc) => {
    acc[npc.id] = npc;
    return acc;
  }, {} as { [npcId: string]: NPC }),
  npcEvolution: {},
  worldHistory: [],
  gameTime: 800, // Start at 8:00 AM
  currentStorylets: [],
  seenStorylets: [],
  knowledgeFlags: [],
  narrativeHistory: [],
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
    updateRelationship: (state, action: PayloadAction<{ npcId: string; type: 'trust' | 'romance' | 'fear'; change: number }>) => {
      const { npcId, type, change } = action.payload;
      if (!state.relationships[npcId]) {
        state.relationships[npcId] = { trust: 0, romance: 0, fear: 0 };
      }
      const current = state.relationships[npcId][type];
      
      if (type === 'trust') {
        state.relationships[npcId][type] = Math.max(-100, Math.min(100, current + change));
      } else {
        state.relationships[npcId][type] = Math.max(0, Math.min(100, current + change));
      }
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
        state.lastStoryletId = action.payload;
      }
    },
    revealName: (state, action: PayloadAction<string>) => {
      if (!state.knownNames.includes(action.payload)) {
        state.knownNames.push(action.payload);
      }
    },
    revealKnowledge: (state, action: PayloadAction<string>) => {
      if (!state.knowledgeFlags.includes(action.payload)) {
        state.knowledgeFlags.push(action.payload);
      }
    },
    setLastChoiceId: (state, action: PayloadAction<string>) => {
      state.lastChoiceId = action.payload;
    },
    addNarrativeHistory: (state, action: PayloadAction<{ id: string; type: 'storylet' | 'choice'; text: string; title?: string }>) => {
      state.narrativeHistory.push(action.payload);
      if (state.narrativeHistory.length > 100) {
        state.narrativeHistory.shift();
      }
    },
    evolveNPC: (state, action: PayloadAction<{ npcId: string; aggChange?: number; fearChange?: number; observedTrait?: string }>) => {
      const { npcId, aggChange = 0, fearChange = 0, observedTrait } = action.payload;
      if (!state.npcEvolution[npcId]) {
        state.npcEvolution[npcId] = { aggression: 50, fear: 0, observedPlayerTraits: [] };
      }
      const npc = state.npcEvolution[npcId];
      npc.aggression = Math.max(0, Math.min(100, npc.aggression + aggChange));
      npc.fear = Math.max(0, Math.min(100, npc.fear + fearChange));
      if (observedTrait && !npc.observedPlayerTraits.includes(observedTrait)) {
        npc.observedPlayerTraits.push(observedTrait);
      }
    },
    logWorldEvent: (state, action: PayloadAction<string>) => {
      state.worldHistory.push({ event: action.payload, timestamp: state.gameTime });
    },
    moveNPC: (state, action: PayloadAction<{ npcId: string; locationId: string }>) => {
      const { npcId, locationId } = action.payload;
      if (state.npcs[npcId]) {
        state.npcs[npcId].simulatedState.lastLocation = locationId;
      }
    },
    updateNPCDisposition: (state, action: PayloadAction<{ npcId: string; disposition: 'friendly' | 'hostile' | 'wary' | 'neutral' }>) => {
      const { npcId, disposition } = action.payload;
      if (state.npcs[npcId]) {
        state.npcs[npcId].disposition = disposition;
      }
    },
    addNPC: (state, action: PayloadAction<NPC>) => {
      if (!state.npcs[action.payload.id]) {
        state.npcs[action.payload.id] = action.payload;
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
  updateRelationship,
  setRelationship,
  addBounty,
  incrementTime,
  setCurrentStorylets,
  markStoryletSeen,
  revealName,
  revealKnowledge,
  setLastChoiceId,
  addNarrativeHistory,
  evolveNPC,
  logWorldEvent,
  moveNPC,
  updateNPCDisposition,
  addNPC,
} = gameSlice.actions;

export default gameSlice.reducer;
