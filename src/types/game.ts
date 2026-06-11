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
}

export interface Storylet {
  id: string;
  title: string;
  content: string; // Supports dynamic variables
  prerequisites: StoryletPrerequisites;
  choices: Choice[];
  priority?: number; // Higher numbers = higher priority
  repeatable?: boolean;
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

export interface NPC {
  id: string;
  name: string;
  factionId?: string;
  personality: {
    tone: string;
    vocabulary: string[];
    visualTells: string[];
  };
  schedule: NPCSchedule[];
}

export type RelationshipStatus = 'stranger' | 'acquaintance' | 'friend' | 'companion' | 'lover' | 'spouse' | 'parent' | 'enemy';

export interface Relationship {
  npcId: string;
  status: RelationshipStatus;
  affinity: number; // -100 to 100
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
  
  gameTime: number; // Chronological marker (0-2400 per day)
  currentStorylets: string[]; // Active storylet IDs
}
