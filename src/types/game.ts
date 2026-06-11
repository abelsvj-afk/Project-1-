export type AlignmentValue = number; // -1000 to 1000

export interface ReputationMatrix {
  [factionId: string]: number;
}

export interface PlayerStats {
  strength: number;
  intelligence: number;
  dexterity: number;
  vitality: number;
  mentality: number;
}

export interface Player {
  stats: PlayerStats;
  alignment: AlignmentValue; // Good/Evil
  purity: AlignmentValue;    // Pure/Corrupt
  wealth: number;
  afflictions: string[];
  balance: number;           // Physical readiness (ms)
  equilibrium: number;       // Mental composure (ms)
  inventory: string[];
  location: string;
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
  addItem?: string[];
  removeItem?: string[];
  statChange?: Partial<PlayerStats>;
  setGlobalFlags?: { [flag: string]: boolean | number | string };
  moveToLocation?: string;
}

export interface Storylet {
  id: string;
  title: string;
  content: string; // Supports dynamic variables
  prerequisites: StoryletPrerequisites;
  choices: Choice[];
}

export interface Choice {
  id: string;
  text: string;
  effects: StoryletEffects;
}

export interface CombatAffliction {
  id: string;
  name: string;
  description: string;
  type: 'physical' | 'mental';
}

export interface CombatCure {
  id: string;
  name: string;
  cures: string[]; // IDs of CombatAffliction
  type: 'ingestion' | 'topical' | 'inhalation';
}

export interface GameState {
  player: Player;
  reputation: ReputationMatrix;
  globalFlags: { [flag: string]: boolean | number | string };
  gameTime: number; // Chronological marker
  currentStorylets: string[]; // Active storylet IDs
}
