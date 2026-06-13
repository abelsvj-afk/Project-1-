import personalities from '../data/personalities.json';
import { withDiagnostics } from './utils/diagnostics';

export type TraitType = 'greed' | 'fear' | 'bravery';

export interface NPCPersonality {
  trait: TraitType;
  voiceSeed: number;
}

/**
 * Generates a stable personality based on an NPC ID and a world seed.
 */
const _rollPersonality = (npcId: string, worldSeed: number): NPCPersonality => {
  // Simple deterministic hash based on ID and world seed
  const hash = Array.from(npcId + worldSeed).reduce(
    (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc),
    0
  );
  
  const traits: TraitType[] = ['greed', 'fear', 'bravery'];
  const trait = traits[Math.abs(hash) % traits.length];
  
  return {
    trait,
    voiceSeed: Math.abs(hash),
  };
};

export const rollPersonality = withDiagnostics(_rollPersonality, 'rollPersonality');

/**
 * Returns a greeting based on the NPC's rolled personality.
 */
const _getGreeting = (personality: NPCPersonality): string => {
  const bucket = personalities.traitBuckets[personality.trait];
  const index = personality.voiceSeed % bucket.greetings.length;
  return bucket.greetings[index];
};

export const getGreeting = withDiagnostics(_getGreeting, 'getGreeting');

/**
 * Returns a reaction based on the player's choice type.
 */
const _getReaction = (
  personality: NPCPersonality,
  choiceType: 'help' | 'threat' | 'silence'
): string => {
  return personalities.traitBuckets[personality.trait].reactions[choiceType];
};

export const getReaction = withDiagnostics(_getReaction, 'getReaction');
