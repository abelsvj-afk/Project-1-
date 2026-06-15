import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ReputationMatrix, Bounty, RelationshipStatus, NPC, ActiveCombat, ActiveEnemy, CombatLogEntry, EnemyTemplate } from '../../types/game';
import socialData from '../../data/socialData.json';

interface GameStateSlice {
  reputation: ReputationMatrix;
  globalFlags: { [flag: string]: boolean | number | string };
  unlockedBlueprints: string[];
  activeSpells: string[];
  activeLaws: string[];
  activeBounties: Bounty[];
  townControl: { [townId: string]: string };
  ownedProperties: string[];
  relationships: { [npcId: string]: RelationshipStatus };
  affinity: { [npcId: string]: number };
  knownNames: string[];
  forcedStoryletId?: string;
  activeConversationNpcId?: string;
  npcs: { [npcId: string]: NPC };
  npcEvolution: { [npcId: string]: { aggression: number; fear: number; observedPlayerTraits: string[] } };
  worldHistory: { event: string; timestamp: number }[];
  activeCombat: ActiveCombat | null;
  gameTime: number;
  currentStorylets: string[];
  seenStorylets: string[];
  knowledgeFlags: string[];
  lastStoryletId?: string;
  lastChoiceId?: string;
  narrativeHistory: { id: string; type: 'storylet' | 'choice'; text: string; title?: string }[];
  /** Hidden "spider-web" profile: accumulated weight per thematic tag, built from
   *  the choices the player makes. Drives which storylets/fragments resonate. */
  contextProfile: { [tag: string]: number };
  /** World-map nodes the player has set foot in (fog-of-war for the travel UI). */
  visitedNodes: string[];
  /** Open narrative threads — multi-beat arcs the Director keeps advancing until
   *  resolved, so choices lead to coherent consequences instead of random cards. */
  openThreads: string[];
  /** Hired workforce — NPCs employed in a role/tier that generate passive income. */
  employees: { npcId: string; role: string; tier: number }[];
  /** Fractional passive income carried between ticks until it rounds to ≥1 shard. */
  incomeBuffer: number;
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
  relationships: {},
  affinity: {},
  knownNames: [],
  npcs: (socialData.npcs as any[]).reduce((acc, npc) => {
    acc[npc.id] = npc;
    return acc;
  }, {} as { [npcId: string]: NPC }),
  npcEvolution: {},
  worldHistory: [],
  activeCombat: null,
  gameTime: 800,
  currentStorylets: [],
  seenStorylets: [],
  knowledgeFlags: [],
  narrativeHistory: [],
  contextProfile: {},
  visitedNodes: ['static_crater'],
  openThreads: [],
  employees: [],
  incomeBuffer: 0,
};

const MAX_EMPLOYEE_TIER = 3;

/** Upper bound on any single tag's weight so the profile stays responsive to
 *  recent shifts instead of locking in early. */
const CONTEXT_TAG_CAP = 25;

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
    setForcedStorylet: (state, action: PayloadAction<string | undefined>) => {
      state.forcedStoryletId = action.payload;
    },
    setActiveConversationNpc: (state, action: PayloadAction<string | undefined>) => {
      state.activeConversationNpcId = action.payload;
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
      const rel = state.relationships[npcId];
      if (type === 'trust') {
        rel.trust = Math.max(-100, Math.min(100, rel.trust + change));
      } else {
        rel[type] = Math.max(0, Math.min(100, rel[type] + change));
      }

      // Cascade: high fear lowers trust (inline, no middleware needed)
      if (type === 'fear' && change > 0 && rel.fear > 50) {
        const trustLower = Math.floor(change * 0.5);
        if (trustLower > 0) {
          rel.trust = Math.max(-100, rel.trust - trustLower);
        }
      }

      // Cascade: romance boosts trust
      if (type === 'romance' && change > 0) {
        const trustBoost = Math.floor(change * 0.2);
        if (trustBoost > 0) {
          rel.trust = Math.min(100, rel.trust + trustBoost);
        }
      }
    },
    setRelationship: (state, action: PayloadAction<{ npcId: string; status: RelationshipStatus }>) => {
      state.relationships[action.payload.npcId] = action.payload.status;
    },
    addBounty: (state, action: PayloadAction<Bounty>) => {
      const exists = state.activeBounties.some(b => b.factionId === action.payload.factionId && b.targetId === action.payload.targetId);
      if (!exists) state.activeBounties.push(action.payload);
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
    visitNode: (state, action: PayloadAction<string>) => {
      if (!state.visitedNodes.includes(action.payload)) {
        state.visitedNodes.push(action.payload);
      }
    },
    openThread: (state, action: PayloadAction<string>) => {
      if (!state.openThreads.includes(action.payload)) {
        state.openThreads.push(action.payload);
      }
    },
    resolveThread: (state, action: PayloadAction<string>) => {
      state.openThreads = state.openThreads.filter(t => t !== action.payload);
    },
    hireEmployee: (state, action: PayloadAction<{ npcId: string; role: string }>) => {
      const { npcId, role } = action.payload;
      if (!state.employees.some(e => e.npcId === npcId)) {
        state.employees.push({ npcId, role, tier: 1 });
      }
    },
    fireEmployee: (state, action: PayloadAction<string>) => {
      state.employees = state.employees.filter(e => e.npcId !== action.payload);
    },
    promoteEmployee: (state, action: PayloadAction<string>) => {
      const emp = state.employees.find(e => e.npcId === action.payload);
      if (emp && emp.tier < MAX_EMPLOYEE_TIER) emp.tier += 1;
    },
    setIncomeBuffer: (state, action: PayloadAction<number>) => {
      state.incomeBuffer = action.payload;
    },
    reinforceContext: (state, action: PayloadAction<string[]>) => {
      // Each reinforced tag grows; all other tags gently decay so the profile
      // tracks the player's *recent* leanings (the "drift" of the spider-web).
      const incoming = new Set(action.payload);
      for (const tag of Object.keys(state.contextProfile)) {
        if (!incoming.has(tag)) {
          const decayed = state.contextProfile[tag] - 1;
          if (decayed <= 0) delete state.contextProfile[tag];
          else state.contextProfile[tag] = decayed;
        }
      }
      for (const tag of incoming) {
        state.contextProfile[tag] = Math.min(CONTEXT_TAG_CAP, (state.contextProfile[tag] || 0) + 3);
      }
    },
    addNarrativeHistory: (state, action: PayloadAction<{ id: string; type: 'storylet' | 'choice'; text: string; title?: string }>) => {
      state.narrativeHistory.push(action.payload);
      if (state.narrativeHistory.length > 100) {
        state.narrativeHistory.shift();
      }
    },
    consolidateHistory: (state, action: PayloadAction<string>) => {
      const summary = action.payload;
      const recent = state.narrativeHistory.slice(-10);
      state.narrativeHistory = [
        { id: 'history_summary', type: 'storylet', text: summary, title: 'Previous Memories' },
        ...recent
      ];
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
      if (state.worldHistory.length > 50) state.worldHistory.shift();
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

    // ─── Combat Actions ────────────────────────────────────────────────────
    startCombat: (state, action: PayloadAction<EnemyTemplate>) => {
      const template = action.payload;
      const enemy: ActiveEnemy = {
        ...template,
        vitality: template.maxVitality,
        balance: 2000, // 2 second delay before first attack
        equilibrium: 2000,
        afflictions: [],
      };
      state.activeCombat = {
        enemy,
        round: 1,
        log: [{ msg: `A ${enemy.name} appears! ${enemy.description}`, type: 'system', ts: Date.now() }],
        isOver: false,
      };
    },
    endCombat: (state, action: PayloadAction<{ playerWon: boolean }>) => {
      if (state.activeCombat) {
        state.activeCombat.isOver = true;
        state.activeCombat.playerWon = action.payload.playerWon;
        // Bridge the result back into the narrative layer so aftermath storylets
        // can gate on it (e.g. globalFlags: { combat_outcome: "victory" }).
        state.globalFlags['combat_outcome'] = action.payload.playerWon ? 'victory' : 'defeat';
        state.globalFlags['combat_last_enemy'] = state.activeCombat.enemy.id;
      }
    },
    clearCombat: (state) => {
      state.activeCombat = null;
    },
    damageEnemy: (state, action: PayloadAction<number>) => {
      if (state.activeCombat) {
        state.activeCombat.enemy.vitality = Math.max(0, state.activeCombat.enemy.vitality - action.payload);
      }
    },
    afflictEnemy: (state, action: PayloadAction<string>) => {
      if (state.activeCombat && !state.activeCombat.enemy.afflictions.includes(action.payload)) {
        state.activeCombat.enemy.afflictions.push(action.payload);
      }
    },
    cureEnemyAffliction: (state, action: PayloadAction<string>) => {
      if (state.activeCombat) {
        state.activeCombat.enemy.afflictions = state.activeCombat.enemy.afflictions.filter(a => a !== action.payload);
      }
    },
    tickEnemy: (state) => {
      if (!state.activeCombat || state.activeCombat.isOver) return;
      const enemy = state.activeCombat.enemy;
      enemy.balance = Math.max(0, enemy.balance - 100);
      enemy.equilibrium = Math.max(0, enemy.equilibrium - 100);
    },
    setEnemyBalance: (state, action: PayloadAction<number>) => {
      if (state.activeCombat) state.activeCombat.enemy.balance = action.payload;
    },
    setEnemyEquilibrium: (state, action: PayloadAction<number>) => {
      if (state.activeCombat) state.activeCombat.enemy.equilibrium = action.payload;
    },
    addCombatLog: (state, action: PayloadAction<Omit<CombatLogEntry, 'ts'>>) => {
      if (state.activeCombat) {
        state.activeCombat.log.push({ ...action.payload, ts: Date.now() });
        if (state.activeCombat.log.length > 50) state.activeCombat.log.shift();
      }
    },
    incrementCombatRound: (state) => {
      if (state.activeCombat) state.activeCombat.round += 1;
    },
  },
});

export const {
  updateReputation,
  setGlobalFlag,
  setForcedStorylet,
  setActiveConversationNpc,
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
  reinforceContext,
  visitNode,
  openThread,
  resolveThread,
  hireEmployee,
  fireEmployee,
  promoteEmployee,
  setIncomeBuffer,
  addNarrativeHistory,
  consolidateHistory,
  evolveNPC,
  logWorldEvent,
  moveNPC,
  updateNPCDisposition,
  addNPC,
  startCombat,
  endCombat,
  clearCombat,
  damageEnemy,
  afflictEnemy,
  cureEnemyAffliction,
  tickEnemy,
  setEnemyBalance,
  setEnemyEquilibrium,
  addCombatLog,
  incrementCombatRound,
} = gameSlice.actions;

export default gameSlice.reducer;
