export type AlignmentValue = number; // -1000 to 1000

export interface ReputationMatrix {
  [factionId: string]: number;
}

export interface PlayerStats {
  vessel: number;     // Physical capacity for magic (Thermal)
  logic: number;      // Mental calculation of resonance (Vector)
  finesse: number;    // Precision in channeling (Cognitive)
  resonance: number;  // Connection to spirits (Biomorphic)
  vitality: number;
  mentality: number;
  stamina: number;    // Physical action pool (max)
  focus: number;      // Mental action pool (max)
}

export interface Equipment {
  id: string;
  name: string;
  slot: 'head' | 'chest' | 'hands' | 'weapon' | 'relic';
  quality: 'junk' | 'standard' | 'refined' | 'masterwork' | 'artifact';
  attributes: Partial<PlayerStats>;
  affinityBonus?: {
    type: 'thermal' | 'vector' | 'biomorphic' | 'cognitive';
    value: number;
  };
  level: number;
  maxLevel: number;
  description: string;
}

export interface BodyMarking {
  id: string;
  type: string;
  location: 'face' | 'chest' | 'back' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg';
  description: string;
}

export interface Appearance {
  bodyType: string;
  musculature: string;
  height: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  eyeType: string;
  skinTone: string;
  scars: BodyMarking[];
  tattoos: BodyMarking[];
  facialFeatures: string[];
}

export interface Pronouns {
  subject: string;
  object: string;
  possessive: string;
}

export interface Player {
  name: string;
  appearance: Appearance;
  pronouns: Pronouns;
  stats: PlayerStats;
  level: number;
  experience: number;
  skillPoints: number;
  blessedAbility?: string;
  isBlessedSkillRevealed: boolean;
  alignment: AlignmentValue;
  purity: AlignmentValue;
  wealth: number;
  afflictions: string[];
  balance: number;      // Physical cooldown (ms)
  equilibrium: number;  // Mental cooldown (ms)
  stamina: number;      // Current physical pool
  focus: number;        // Current mental pool
  inventory: (string | Equipment)[];
  equipment: {
    head?: Equipment;
    chest?: Equipment;
    hands?: Equipment;
    weapon?: Equipment;
    relic?: Equipment;
  };
  location: string;
  presence?: {
    uncanny: number;
    intimidating: number;
    exotic: number;
    normalized: number;
    factionTags: string[];
  };
  presenceDescription?: string;
  history: {
    majorChoices: string[];
    factionInfluence: { [factionId: string]: number };
    factionMenace: { [factionId: string]: number };
  };
  companions: string[]; // NPC IDs — single source of truth
}

export interface StoryletPrerequisites {
  location?: string;
  minAlignment?: AlignmentValue;
  maxAlignment?: AlignmentValue;
  minPurity?: AlignmentValue;
  maxPurity?: AlignmentValue;
  minWealth?: number;
  requiredItems?: string[];
  requiredStats?: Partial<PlayerStats>;
  globalFlags?: { [flag: string]: boolean | number | string };
  lastStoryletId?: string;
  lastChoiceId?: string;
  knowledgeFlags?: string[];
  requiredNpc?: string;
  requiredAnyNpc?: boolean;
  requiredMilestone?: string;
  requiresThread?: string; // only available while this narrative thread is open
}

export interface StoryletEffects {
  alignmentChange?: number;
  purityChange?: number;
  wealthChange?: number;
  experienceGain?: number;
  setBlessedAbility?: string;
  addItem?: string[];
  removeItem?: string[];
  statChange?: Partial<PlayerStats>;
  setGlobalFlags?: { [flag: string]: boolean | number | string };
  moveToLocation?: string;
  revealNames?: string[];
  revealKnowledge?: string[];
  revealBlessedSkill?: boolean;
  triggerLoot?: string;
  triggerCombat?: string; // enemy template ID from combatData.enemies
  recruitCompanion?: string; // NPC ID to add to player.companions
  dismissCompanion?: string; // NPC ID to remove from player.companions
  openThread?: string; // open a narrative thread the Director will follow up
  resolveThread?: string; // close a narrative thread
}

export interface Storylet {
  id: string;
  title: string;
  content: string;
  prerequisites: StoryletPrerequisites;
  choices: Choice[];
  priority?: number;
  repeatable?: boolean;
  timeLimit?: number;
  defaultChoiceId?: string;
  /** Thematic tags used by the Context Profile to bias which storylets are dealt.
   *  A storylet resonates with a player whose profile shares its tags, and creates
   *  tension when it carries tags opposing the player's dominant leanings. */
  tags?: string[];
}

export interface Choice {
  id: string;
  text: string;
  effects: StoryletEffects;
  followUpId?: string;
  /** Tags reinforced into the player's Context Profile when this choice is taken. */
  tags?: string[];
}

export type MagicCurrent = 'thermal' | 'vector' | 'biomorphic' | 'cognitive';

export interface CombatSpell {
  id: string;
  name: string;
  description: string;
  current: MagicCurrent;
  cost: {
    vitality?: number;
    mentality?: number;
    balance?: number;
    equilibrium?: number;
  };
  effects: {
    damage?: number;
    applyAfflictions?: string[];
  };
}

export interface CombatAffliction {
  id: string;
  name: string;
  description: string;
  type: 'physical' | 'mental';
  effectOnTick?: {
    vitalityChange?: number;
    mentalityChange?: number;
    balanceDrain?: number;
    equilibriumDrain?: number;
  };
}

export interface CombatCure {
  id: string;
  name: string;
  cures: string[];
  delivery: 'ingestion' | 'topical' | 'inhalation' | 'smoke';
}

export interface EnemyAttack {
  name: string;
  damage: number;
  affliction?: string;
  type: 'physical' | 'mental';
  balanceCost?: number;
  equilibriumCost?: number;
}

export interface EnemyTemplate {
  id: string;
  name: string;
  description: string;
  level: number;
  maxVitality: number;
  stats: PlayerStats;
  attacks: EnemyAttack[];
  xpReward: number;
  lootTable: string;
}

export interface ActiveEnemy extends EnemyTemplate {
  vitality: number;
  balance: number;
  equilibrium: number;
  afflictions: string[];
}

export interface CombatLogEntry {
  msg: string;
  type: 'player' | 'enemy' | 'system';
  ts: number;
}

export interface ActiveCombat {
  enemy: ActiveEnemy;
  round: number;
  log: CombatLogEntry[];
  isOver: boolean;
  playerWon?: boolean;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  type: 'home' | 'storefront' | 'tavern' | 'outpost';
  purchasePrice: number;
  baseIncome: number;
  upkeep: number;
  ownerFaction?: string;
}

export interface Law {
  id: string;
  name: string;
  description: string;
  effect: {
    taxModifier?: number;
    menaceModifier?: { [factionId: string]: number };
    restrictedItems?: string[];
  };
}

export interface Bounty {
  id: string;
  factionId: string;
  targetId: string;
  amount: number;
  reason: string;
}

export interface NPCSchedule {
  timeStart: number;
  timeEnd: number;
  location: string;
  activity: string;
}

export type NPCStatusTier = 1 | 2 | 3 | 4;

export interface TradeItem {
  id: string;
  price: number;
  stock: number;
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  level: number;
  statusTier: NPCStatusTier;
  factionId?: string;
  stats: PlayerStats;
  affinities: string[];
  inventory: string[];
  backstory: string;
  isGenerated?: boolean;
  tradeInventory?: TradeItem[];
  personality: {
    archetype: 'coward' | 'zealot' | 'pragmatist' | 'predator' | 'scholar' | 'greed';
    braveryThreshold: number;
    tone: string;
    vocabulary: string[];
    visualTells: string[];
  };
  schedule: NPCSchedule[];
  simulatedState: {
    currentAction: string;
    goal: string;
    lastLocation: string;
    isDead?: boolean;
    isHired?: boolean;
  };
  disposition?: 'friendly' | 'hostile' | 'wary' | 'neutral';
}

export interface RelationshipStatus {
  trust: number;   // -100 to 100
  romance: number; // 0 to 100
  fear: number;    // 0 to 100
}

export interface Relationship {
  npcId: string;
  status: RelationshipStatus;
  history: string[];
}

export interface GameState {
  player: Player;
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
  forcedStoryletId?: string;
  activeConversationNpcId?: string;
  npcs: { [npcId: string]: NPC };
  npcEvolution: {
    [npcId: string]: {
      aggression: number;
      fear: number;
      observedPlayerTraits: string[];
    }
  };
  worldHistory: { event: string; timestamp: number }[];
  activeCombat: ActiveCombat | null;
  gameTime: number;
  currentStorylets: string[];
  seenStorylets: string[];
  knownNames: string[];
  knowledgeFlags: string[];
  lastStoryletId?: string;
  lastChoiceId?: string;
  narrativeHistory: { id: string; type: 'storylet' | 'choice'; text: string; title?: string }[];
}
