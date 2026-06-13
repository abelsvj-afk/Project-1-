export type AlignmentValue = number; // -1000 to 1000

export interface ReputationMatrix {
  [factionId: string]: number;
}

export interface PlayerStats {
  prowess: number;
  logic: number;
  finesse: number;
  sync: number;
  vitality: number;
  mentality: number;
}

export interface BodyMarking {
  id: string;
  type: string; // e.g., 'burn', 'geometric', 'rune'
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
  eyeType: string; // e.g., 'organic', 'cybernetic', 'blind'
  skinTone: string;
  scars: BodyMarking[];
  tattoos: BodyMarking[];
  facialFeatures: string[];
}

export interface Pronouns {
  subject: string;   // e.g., "he", "she", "they"
  object: string;    // e.g., "him", "her", "them"
  possessive: string; // e.g., "his", "her", "their"
}

export interface Player {
  name: string;
  appearance: Appearance;
  pronouns: Pronouns;
  stats: PlayerStats;
  level: number;
  experience: number;
  skillPoints: number;
  blessedAbility?: string; // Unique Echo-Anchor affinity
  isBlessedSkillRevealed: boolean;
  alignment: AlignmentValue; // Good/Evil
  purity: AlignmentValue;    // Pure/Corrupt
  wealth: number;
  afflictions: string[];
  balance: number;           // Physical readiness (ms)
  equilibrium: number;       // Mental composure (ms)
  inventory: string[];
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
    majorChoices: string[]; // e.g., 'saved_kaelen', 'betrayed_syndicate'
    factionInfluence: { [factionId: string]: number }; // -100 to 100
    factionMenace: { [factionId: string]: number }; // 0 to 100
  };
  companions: string[]; // NPC IDs
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
  revealNames?: string[]; // NPC IDs to reveal
  revealKnowledge?: string[]; // Knowledge flags to unlock
}

export interface Storylet {
  id: string;
  title: string;
  content: string; // Supports dynamic variables
  prerequisites: StoryletPrerequisites;
  choices: Choice[];
  priority?: number; // Higher numbers = higher priority
  repeatable?: boolean;
  timeLimit?: number; // in seconds
  defaultChoiceId?: string; // ID of choice to auto-select on timeout
}

export interface Choice {
  id: string;
  text: string;
  effects: StoryletEffects;
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
  cures: string[]; // IDs of CombatAffliction
  delivery: 'ingestion' | 'topical' | 'inhalation' | 'smoke';
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
  targetId: string; // usually player
  amount: number;
  reason: string;
}

export interface NPCSchedule {
  timeStart: number; // 0-2400
  timeEnd: number;
  location: string;
  activity: string;
}

export type NPCStatusTier = 1 | 2 | 3 | 4; // 1: Grunt, 2: Specialist, 3: Lieutenant, 4: Apex

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
  personality: {
    archetype: 'coward' | 'zealot' | 'pragmatist' | 'predator' | 'scholar' | 'greed';
    braveryThreshold: number; // Morale: 0-100, when they flee
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
}

export interface RelationshipStatus {
  trust: number; // -100 to 100
  romance: number; // 0 to 100
  fear: number; // 0 to 100
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
  activeSpells: string[]; // IDs of CombatSpell
  
  // Politics
  activeLaws: string[]; // IDs of Law
  activeBounties: Bounty[];
  townControl: { [townId: string]: string }; // townId -> factionId or 'player'
  
  // Economy
  ownedProperties: string[]; // IDs of Property
  
  // Kinship
  companions: string[]; // IDs of NPC
  relationships: { [npcId: string]: RelationshipStatus };
  affinity: { [npcId: string]: number };
  
  // Simulated Autonomy & "Machine Learning"
  npcEvolution: { 
    [npcId: string]: { 
      aggression: number; // 0-100
      fear: number; // 0-100
      observedPlayerTraits: string[];
    } 
  };
  worldHistory: { event: string; timestamp: number }[];

  gameTime: number; // Chronological marker (0-2400 per day)
  currentStorylets: string[]; // Active storylet IDs
  seenStorylets: string[];
  knownNames: string[];
  knowledgeFlags: string[];
  lastStoryletId?: string;
  lastChoiceId?: string;
  narrativeHistory: { id: string; type: 'storylet' | 'choice'; text: string; title?: string }[];
}

